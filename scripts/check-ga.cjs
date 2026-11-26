// GA4 計測の自動チェック。変更のあと、本番に出す前に `npm run check:ga` で実行する
//
// 何をするか:
//   1. テスト用の測定ID（G-TEST）でビルドし、ローカルで起動する（--no-build なら既存のビルドを使う）
//   2. ブラウザ（Playwright）で各ページを開き、ボタンを実際に押す
//   3. window.dataLayer に期待したイベントとパラメータが積まれるかを確かめる
// GA 本体（googletagmanager.com）は空のスクリプトに差し替えるので、本番のデータは汚さない。
// Strava 認証（/api/auth/strava）と X の投稿画面には実際には飛ばない。
//
// 2026-11-22〜26 に、初期化スクリプトの正規表現の構文エラーで GA が全停止していた（型チェックでもビルドでも気づけない）。
// その再発防止。計測まわりやレイアウトを変えたら必ず実行する。
//
// 前提: Playwright が require('playwright') で読めること（Claude Code のクラウド環境には入っている）

const { spawn, execSync } = require('node:child_process')
const path = require('node:path')
const { chromium } = require('playwright')

const ROOT = path.resolve(__dirname, '..')
const PORT = 3123
const BASE = `http://localhost:${PORT}`
const GA_ID = 'G-TEST'
const env = {
  ...process.env,
  NEXT_PUBLIC_GA_ID: GA_ID,
  NEXT_PUBLIC_BASE_URL: BASE,
  STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID || 'dummy',
  STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET || 'dummy',
}

const failures = []
function check(name, ok, detail) {
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n    ${detail}`}`)
  if (!ok) failures.push(name)
}

// ページ遷移しても記録が消えないよう、dataLayer への push をテスト側に送る
async function openPage(browser, url) {
  const page = await browser.newPage()
  const pushes = []
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.exposeFunction('__gaRecord', (json) => pushes.push(JSON.parse(json)))
  await page.addInitScript(() => {
    let arr
    Object.defineProperty(window, 'dataLayer', {
      configurable: true,
      get: () => arr,
      set: (v) => {
        arr = v
        const orig = v.push.bind(v)
        v.push = (...items) => {
          for (const it of items) {
            const plain = Array.from(it).filter((x) => typeof x !== 'function' && !(x instanceof Date))
            window.__gaRecord(JSON.stringify(plain))
          }
          return orig(...items)
        }
      },
    })
  })
  await page.route(/googletagmanager\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }))
  await page.route(/\/api\/auth\/strava/, (r) => r.abort())
  // X の投稿画面（新しいタブ）は開かない
  page.context().on('page', (p) => p.close().catch(() => {}))
  await page.goto(BASE + url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  return { page, pushes, errors }
}

const hasConfig = (pushes) => pushes.some((p) => p[0] === 'config' && p[1] === GA_ID)
const findEvent = (pushes, name) => pushes.find((p) => p[0] === 'event' && p[1] === name)
const show = (pushes) => JSON.stringify(pushes.filter((p) => p[0] !== 'js'))

async function run(browser) {
  // 1. どのページでも初期化スクリプトがエラーなく動き、config が呼ばれる
  for (const url of ['/', '/en', '/pt', '/c/climber_female', '/en/c/climber_female', '/privacy', '/en/privacy']) {
    const { page, pushes, errors } = await openPage(browser, url)
    check(`${url}: スクリプトエラーなし`, errors.length === 0, errors.join(' / '))
    check(`${url}: gtag('config') が呼ばれる`, hasConfig(pushes), show(pushes))
    await page.close()
  }

  // 2. プレビュー表示は計測しない
  {
    const { page, pushes, errors } = await openPage(browser, '/result?preview=climber&sex=female')
    check('/result?preview: スクリプトエラーなし', errors.length === 0, errors.join(' / '))
    check('/result?preview: config を呼ばない', !hasConfig(pushes), show(pushes))
    await page.close()
  }

  // 3. トップ: data-ga-event のリンク（ClickTracker）
  {
    const { page, pushes } = await openPage(browser, '/')
    await page.click('[data-ga-id="trust_privacy_link"]', { noWaitAfter: true })
    await page.waitForTimeout(300)
    const e = findEvent(pushes, 'ui_click')
    check('トップ: プライバシーのリンクで ui_click（button_id 付き）', e && e[2]?.button_id === 'trust_privacy_link', show(pushes))
    await page.close()
  }

  // 4. トップ: 予想 → 期間ボタンで diagnosis_start とユーザープロパティ
  //    period は言語に関係なく日本語の表記（3ヶ月など）で送る仕様。非公開を含めるチェックと、キャラを選んだ予想も試す
  for (const c of [
    { url: '/', pick: /わからない|予想しない/, predicted: 'unknown', privateBox: false },
    { url: '/en', pick: /^クライマー$|Climber/, predicted: 'climber', privateBox: true },
    { url: '/pt', pick: /Sprinter|Velocista/, predicted: 'sprinter', privateBox: false },
  ]) {
    const { page, pushes } = await openPage(browser, c.url)
    await page.locator('button').filter({ hasText: c.pick }).first().click()
    await page.waitForTimeout(200)
    if (c.privateBox) await page.locator('input[type="checkbox"]').first().check()
    // 期間ボタンの1つ目（90日）。文言は言語ごとに違う
    await page.locator('button').filter({ hasText: /ヶ月|months?|meses/i }).first().click({ noWaitAfter: true })
    await page.waitForTimeout(1000)
    const e = findEvent(pushes, 'diagnosis_start')
    const expected = { period: '3ヶ月', predicted_type: c.predicted, include_private: c.privateBox ? 'yes' : 'no' }
    check(
      `${c.url}: 期間ボタンで diagnosis_start ${JSON.stringify(expected)}`,
      e && Object.entries(expected).every(([k, v]) => e[2]?.[k] === v),
      show(pushes),
    )
    const up = pushes.find((p) => p[0] === 'set' && p[1] === 'user_properties')
    check(`${c.url}: ユーザープロパティ predicted_type=${c.predicted}`, up && up[2]?.predicted_type === c.predicted, show(pushes))
    await page.close()
  }

  // 5. キャラ紹介ページ: シェア経由の着地（CV）と「あなたも診断する」
  for (const [url, expect] of [
    ['/c/climber_female?utm_campaign=user_share', true],
    ['/en/c/climber_female?utm_campaign=user_share', true],
    ['/pt/c/climber_male?utm_campaign=user_share', true],
    ['/c/climber_female?utm_campaign=owner_post', false],
    ['/c/climber_female', false],
  ]) {
    const { page, pushes } = await openPage(browser, url)
    check(`${url}: share_inflow を${expect ? '送る' : '送らない'}`, !!findEvent(pushes, 'share_inflow') === expect, show(pushes))
    await page.close()
  }
  {
    const { page, pushes } = await openPage(browser, '/c/climber_female')
    await page.click('[data-ga-event="share_page_cta"]', { noWaitAfter: true })
    await page.waitForTimeout(300)
    check('キャラ紹介ページ: 「あなたも診断する」で share_page_cta', !!findEvent(pushes, 'share_page_cta'), show(pushes))
    await page.close()
  }

  // 6. 結果ページのボタン。プレビューは config しないが、ボタンのハンドラが gtag を呼ぶことは確かめられる
  {
    const { page, pushes } = await openPage(browser, '/result?preview=climber&sex=female')
    await page.click('a[href*="x.com/intent"]', { noWaitAfter: true })
    await page.waitForTimeout(300)
    check('結果: 「Xでポスト」で share_x', !!findEvent(pushes, 'share_x'), show(pushes))
    await page.locator('a[href*="x.com/intent"] ~ button').first().click()
    await page.waitForTimeout(3000)
    const sc = findEvent(pushes, 'share_card')
    check('結果: 保存ボタンで share_card（method=download）', sc && sc[2]?.method === 'download', show(pushes))
    await page.click('[data-ga-event="retry_diagnosis"]', { noWaitAfter: true })
    await page.waitForTimeout(300)
    check('結果: 「もう一度診断する」で retry_diagnosis', !!findEvent(pushes, 'retry_diagnosis'), show(pushes))
    await page.close()
  }
}

// 7. 本物の結果ページ（?data=）。Strava 認証から戻った直後と同じ URL で開く
//    - client_id を引き継いで config し、URL から cid を消す
//    - GA に送る URL（page_location・page_referrer）や、どのイベントにも Strava 由来の値（data・名前・キャラ・性別）を載せない（API Policy 5.4）
async function checkRealResult(browser) {
  const result = {
    characterId: 'climber',
    athleteName: '山田 花子',
    profileImageUrl: '',
    sex: 'female',
    stats: { totalRides: 40, avgDistanceKm: 60, totalDistanceKm: 2400, totalElevationM: 16000, avgSpeedKmh: 27, climbingRatioMPerKm: 6.7, ridingDaysPerWeek: 3, avgWatts: 0, periodDays: 90, outdoorRides: 40, indoorRides: 0 },
    scores: { climbing: 85, speed: 50, endurance: 60, power: 0, consistency: 55 },
  }
  const data = Buffer.from(JSON.stringify(result), 'utf8').toString('base64url')
  const { page, pushes } = await openPage(browser, `/result?data=${data}&cid=123456.789`)
  const cfg = pushes.find((p) => p[0] === 'config' && p[1] === GA_ID)
  check('結果（?data=&cid=）: client_id を引き継いで config', cfg?.[2]?.client_id === '123456.789', show(pushes))
  check('結果: config 後に URL から cid を消す（data は残す）', !page.url().includes('cid=') && page.url().includes('data='), page.url())
  check('結果: GA に送る page_location に data・cid を含めない', !!cfg?.[2]?.page_location && !/[?&](data|cid)=/.test(cfg[2].page_location), cfg?.[2]?.page_location)

  await page.click('a[href*="x.com/intent"]', { noWaitAfter: true })
  await page.waitForTimeout(300)
  check('結果（?data=）: 「Xでポスト」で share_x', !!findEvent(pushes, 'share_x'), show(pushes))

  // 結果ページからトップへ戻ったときの referrer にも data を載せない（同じサイト内の移動はリファラーに URL 全体が入るため）
  await page.goto(BASE + '/', { waitUntil: 'networkidle', referer: `${BASE}/result?data=${data}` })
  await page.waitForTimeout(300)
  const topCfg = pushes.filter((p) => p[0] === 'config' && p[1] === GA_ID).pop()
  check('トップ（結果ページから来た）: page_referrer に data を含めない', !/[?&]data=/.test(topCfg?.[2]?.page_referrer ?? ''), topCfg?.[2]?.page_referrer)

  // dataLayer に積まれたすべての値に、Strava 由来の値が含まれていないか
  const all = JSON.stringify(pushes)
  const leaks = [data, '山田', result.characterId, '"female"', 'female', '2400', '16000'].filter((v) => all.includes(v))
  check('結果: GA のどのデータにも Strava 由来の値（data・名前・キャラ・性別・数値）が入っていない', leaks.length === 0, `含まれていた値: ${leaks.join(', ')}\n    ${show(pushes)}`)
  await page.close()
}

async function isServerUp() {
  try {
    return (await fetch(BASE + '/')).ok
  } catch {
    return false
  }
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    if (await isServerUp()) return
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error('サーバーが起動しませんでした')
}

;(async () => {
  if (!process.argv.includes('--no-build')) {
    console.log(`テスト用の測定ID ${GA_ID} でビルドします…`)
    execSync('npx next build', { cwd: ROOT, env, stdio: ['ignore', 'ignore', 'inherit'] })
  }
  // 前回の実行のサーバーが残っていると、古いビルドを検査して誤って合格してしまうので、ポートが空いているか先に確かめる
  if (await isServerUp()) {
    console.error(`ポート ${PORT} ですでに何かが動いています。止めてから実行してください（例: pkill -f next-server）`)
    process.exit(1)
  }
  // npx を挟まず next 本体を直接起動する（npx 経由だと終了時に next-server が残ることがある）
  const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', String(PORT)], { cwd: ROOT, env, stdio: 'ignore' })
  let browser
  try {
    await waitForServer()
    browser = await chromium.launch()
    await run(browser)
    await checkRealResult(browser)
  } catch (e) {
    console.error(e)
    failures.push('実行エラー')
  } finally {
    if (browser) await browser.close()
    server.kill('SIGTERM')
  }
  console.log(failures.length ? `\n✗ ${failures.length} 件失敗` : '\n✓ すべての計測が動いています')
  console.log('注意: このビルドは G-TEST 入りです。本番に出すビルドは Vercel が作り直すので問題ありません')
  process.exit(failures.length ? 1 : 0)
})()
