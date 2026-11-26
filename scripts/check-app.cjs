// アプリ全体の動作チェック。変更のあと、本番に出す前に `npm run check` で実行する（GAの計測チェックとセット）
//
// 何を確かめるか（ローカルで本番と同じビルドを起動し、HTTP とブラウザで実際に開く）:
//   1. 全ページ（3言語 × トップ・プライバシー・キャラ紹介12種・結果プレビュー12種）が 200 で開き、
//      スクリプトエラーがなく、キャラ画像が読み込め、スマホ幅で横にはみ出さない
//   2. 言語の振り分け（middleware）: Accept-Language・Cookie・クローラー・/ja の転送・知らない言語の404
//   3. Strava 認証の開始: 認可URL・redirect_uri・scope（非公開を含むかどうか）・state（期間・言語）
//   4. 認証コールバックのエラー処理（拒否・code なし）
//   5. 結果ページ: ?data= の復元（日本語の名前も）、壊れた data、予想の答え合わせ、前回との比較、シェアボタンのURL、画像の保存
//   6. OGP・サイトマップ・robots.txt・結果ページの noindex
// Strava API には一切つながない（コールバックは code なし・エラーの経路だけ試す）。GA 本体は空のスクリプトに差し替える。
//
// 使い方: npm run check（ビルド → GAチェック → このチェック）。このファイルだけなら node scripts/check-app.cjs [--no-build]
// 前提: Playwright が require('playwright') で読めること（Claude Code のクラウド環境には入っている）

const { spawn, execSync } = require('node:child_process')
const path = require('node:path')
const { chromium } = require('playwright')

const ROOT = path.resolve(__dirname, '..')
const PORT = 3125
const BASE = `http://localhost:${PORT}`
const env = {
  ...process.env,
  NEXT_PUBLIC_GA_ID: 'G-TEST',
  NEXT_PUBLIC_BASE_URL: BASE,
  STRAVA_CLIENT_ID: 'test-client-id',
  STRAVA_CLIENT_SECRET: 'test-client-secret',
}

const LANGS = ['', '/en', '/pt'] // 日本語は言語なし
const TYPES = ['climber', 'sprinter', 'tt', 'granfondo', 'allrounder', 'weekend']
const SEXES = ['male', 'female']

const failures = []
function check(name, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${name}${ok || !detail ? '' : `\n    ${detail}`}`)
  if (!ok) failures.push(name)
}

// リダイレクトを追わずに1回だけリクエストする
async function req(url, headers = {}) {
  const res = await fetch(BASE + url, { redirect: 'manual', headers })
  return { status: res.status, location: res.headers.get('location') ?? '', type: res.headers.get('content-type') ?? '', text: () => res.text() }
}

// 結果ページの ?data= を作る（lib/result-data.ts の encodeResult と同じ形: JSON → UTF-8 → Base64url）
function encodeResult(r) {
  return Buffer.from(JSON.stringify(r), 'utf8').toString('base64url')
}
function fakeResult(characterId, scores) {
  return {
    characterId,
    athleteName: '山田 花子', // 日本語の名前が文字化けせずに出るか
    profileImageUrl: '',
    sex: 'female',
    stats: { totalRides: 40, avgDistanceKm: 60, totalDistanceKm: 2400, totalElevationM: 16000, avgSpeedKmh: 27, climbingRatioMPerKm: 6.7, ridingDaysPerWeek: 3, avgWatts: 0, periodDays: 90, outdoorRides: 40, indoorRides: 0 },
    scores,
  }
}

// 結果ページの「Xでポスト」は自サイトの中継（/api/share/x）を通して X の投稿画面へ転送する。
// 中継をたどって、最終的な X の intent URL と、その中のシェアURLを返す
const X_SHARE = 'a[href^="/api/share/x"]'
async function followShare(href) {
  if (!href) return { intent: null, shareUrl: null }
  const r = await req(href)
  let intent = null
  try { intent = new URL(r.location) } catch {}
  const shareUrl = intent?.searchParams.get('url') ? new URL(intent.searchParams.get('url')) : null
  return { status: r.status, intent, shareUrl }
}

// 結果ページ上の外部サイトへのリンクに、診断結果（キャラID・性別）が入っていないか。
// 入っていると GA4 の「離脱クリック」がそのURLを自動で記録し、Strava 由来のデータが GA に送られる（API Policy 5.4）
async function externalLinksWithResult(page) {
  return page.evaluate((ids) =>
    Array.from(document.querySelectorAll('a[href]'))
      .map((a) => a.href)
      .filter((h) => new URL(h).origin !== location.origin)
      .filter((h) => ids.some((id) => h.includes(id)) || /_(male|female)\b/.test(h)),
  ['climber', 'sprinter', 'tt_', 'granfondo', 'allrounder', 'weekend'])
}

async function newPage(browser, viewport) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text())
  })
  // 読み込みに失敗した自サイトのファイル（CSS・JS・画像・フォントなど）。外部（GA・Google Fonts）は対象外
  page.on('response', (r) => {
    if (r.url().startsWith(BASE) && r.status() >= 400 && !r.url().includes('/api/auth/')) errors.push(`${r.status()} ${r.url()}`)
  })
  await page.route(/googletagmanager\.com|google-analytics\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }))
  return { context, page, errors }
}

// 1. 全ページ
async function checkPages(browser) {
  const paths = []
  for (const l of LANGS) {
    paths.push(l || '/', `${l}/privacy`)
    for (const t of TYPES) for (const s of SEXES) paths.push(`${l}/c/${t}_${s}`, `${l}/result?preview=${t}&sex=${s}`)
  }
  const { context, page, errors } = await newPage(browser, { width: 1280, height: 800 })
  let bad = 0
  for (const p of paths) {
    errors.length = 0
    const res = await page.goto(BASE + p, { waitUntil: 'networkidle' })
    const brokenImages = await page.evaluate(() =>
      Array.from(document.images).filter((i) => i.src.includes('/characters/') || i.src.includes('/_next/image')).filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
    )
    // 見出し h1 はページに1つ（検索エンジン・読み上げソフトがページの主題を知るため）。アイコンとテーマ色の指定もあるか
    const head = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      icon: !!document.querySelector('link[rel="icon"]'),
      manifest: !!document.querySelector('link[rel="manifest"]'),
      theme: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? '',
    }))
    const ok = res.status() === 200 && errors.length === 0 && brokenImages.length === 0 && head.h1 === 1 && head.icon && head.manifest && !!head.theme
    if (!ok) {
      bad++
      check(`ページ ${p}`, false, `status=${res.status()} errors=${errors.join(' / ')} broken=${brokenImages.join(', ')} head=${JSON.stringify(head)}`)
    }
  }
  check(`全ページ（${paths.length}件）が 200・エラーなし・画像の読み込み成功・h1が1つ・アイコンとテーマ色あり`, bad === 0)
  await context.close()

  // スマホ幅で横にはみ出さないか（主要ページだけ）
  const mobile = await newPage(browser, { width: 390, height: 844 })
  for (const l of LANGS) {
    for (const p of [l || '/', `${l}/c/climber_female`, `${l}/result?preview=climber&sex=female`, `${l}/privacy`]) {
      await mobile.page.goto(BASE + p, { waitUntil: 'networkidle' })
      const overflow = await mobile.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      check(`スマホ幅 ${p}: 横にはみ出さない`, overflow <= 1, `はみ出し ${overflow}px`)
      // タップしやすさ（WCAG 2.2 の目安: 24px 以上）。文中のリンク（display: inline）は対象外
      const small = await mobile.page.evaluate(() =>
        Array.from(document.querySelectorAll('a, button'))
          .filter((e) => getComputedStyle(e).display !== 'inline')
          .map((e) => ({ t: (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 20), r: e.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0 && (r.height < 24 || r.width < 24))
          .map(({ t, r }) => `${t}(${Math.round(r.width)}x${Math.round(r.height)})`),
      )
      check(`スマホ幅 ${p}: ボタン・リンクが 24px 以上`, small.length === 0, small.join(', '))
      // 文字のコントラスト（WCAG AA 4.5:1）。暗い背景に白を薄くして載せている文字が、薄すぎないか（白の不透明度 0.5 未満を薄すぎとみなす）。
      // 透明な文字（グラデーション文字）・ロゴ（data-logo）は対象外
      const faint = await mobile.page.evaluate(() =>
        Array.from(document.querySelectorAll('body *'))
          .filter((e) => !e.closest('[data-logo]') && Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim()))
          .filter((e) => {
            const m = getComputedStyle(e).color.match(/^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/)
            return m && +m[1] > 200 && +m[2] > 200 && +m[3] > 200 && +m[4] > 0 && +m[4] < 0.5
          })
          .map((e) => `${e.textContent.trim().slice(0, 15)}(${getComputedStyle(e).color})`),
      )
      check(`スマホ幅 ${p}: 薄すぎる文字がない（コントラスト 4.5:1 以上）`, faint.length === 0, faint.slice(0, 8).join(', '))
    }
  }
  await mobile.context.close()
}

// 2. 言語の振り分け
async function checkMiddleware() {
  const cases = [
    ['/', { 'accept-language': 'ja-JP,ja;q=0.9' }, 200, ''],
    ['/', {}, 200, ''],
    ['/', { 'accept-language': 'pt-BR,pt;q=0.9' }, 307, '/pt'],
    ['/', { 'accept-language': 'en-US,en;q=0.9' }, 307, '/en'],
    ['/', { 'accept-language': 'es-ES' }, 307, '/en'],
    ['/', { 'accept-language': 'ja', cookie: 'veloava_locale=en' }, 307, '/en'],
    ['/', { 'accept-language': 'pt-BR', cookie: 'veloava_locale=ja' }, 200, ''],
    ['/', { 'accept-language': 'pt-BR', 'user-agent': 'Twitterbot/1.0' }, 200, ''],
    ['/c/climber_male', { 'accept-language': 'pt-BR' }, 307, '/pt/c/climber_male'],
    ['/c/climber_male?utm_source=x&utm_medium=social&utm_campaign=user_share', { 'accept-language': 'pt-BR' }, 307, '/pt/c/climber_male', 'utm_campaign=user_share'],
    ['/ja/c/climber_male?utm_campaign=user_share', {}, 307, '/c/climber_male', 'utm_campaign=user_share'],
    ['/result?preview=climber', { 'accept-language': 'en-US' }, 200, ''],
    ['/privacy', { 'accept-language': 'en-US' }, 200, ''],
    ['/ja/privacy', {}, 307, '/privacy'],
    ['/ja', {}, 307, '/'],
    ['/en', { 'accept-language': 'ja' }, 200, ''],
    ['/fr', {}, 404, ''],
    ['/c/unknown_male', {}, 404, ''],
    ['/c/climber_other', {}, 404, ''],
    ['/c/climber_female_x', {}, 404, ''],
    // ドットを含む言語部分は middleware を通らないので、ページ側で 404 にしているか（以前はプライバシーが 500 になった）
    ['/x.y/privacy', {}, 404, ''],
    ['/x.y/result', {}, 404, ''],
    ['/x.y/c/climber_male', {}, 404, ''],
    ['/a.b', {}, 404, ''],
  ]
  for (const [url, headers, status, loc, keepQuery] of cases) {
    const r = await req(url, headers)
    // keepQuery: 転送先にクエリ（シェアのUTMなど）が残っていること
    const locOk = (!loc || new URL(r.location, BASE).pathname === loc) && (!keepQuery || r.location.includes(keepQuery))
    check(`言語振り分け ${url} ${JSON.stringify(headers)} → ${status}${loc ? ` ${loc}` : ''}`, r.status === status && locOk, `実際: ${r.status} ${r.location}`)
  }
}

// 3. Strava 認証の開始
async function checkAuthStart() {
  const cases = [
    ['/api/auth/strava?period=90', 'read,activity:read', '90'],
    ['/api/auth/strava?period=365&private=1', 'read,activity:read_all', '365'],
    ['/api/auth/strava?period=180&lang=en&cid=123.456', 'read,activity:read', '180:123.456:en'],
    ['/api/auth/strava?period=999&lang=fr&cid=evil', 'read,activity:read', '90'],
  ]
  for (const [url, scope, state] of cases) {
    const r = await req(url)
    let u
    try { u = new URL(r.location) } catch {}
    const ok =
      r.status === 307 &&
      u?.origin === 'https://www.strava.com' &&
      u.pathname === '/oauth/authorize' &&
      u.searchParams.get('client_id') === 'test-client-id' &&
      u.searchParams.get('redirect_uri') === `${BASE}/api/auth/callback` &&
      u.searchParams.get('scope') === scope &&
      u.searchParams.get('state') === state
    check(`認証開始 ${url} → scope=${scope} state=${state}`, ok, `実際: ${r.status} ${r.location}`)
  }
}

// 4. 認証コールバックのエラー処理（Strava にはつながない経路だけ）
async function checkCallback() {
  const cases = [
    ['/api/auth/callback?error=access_denied&state=90', '/', 'access_denied'],
    ['/api/auth/callback?state=90::en', '/en', 'no_code'],
    ['/api/auth/callback?error=access_denied&state=90::pt', '/pt', 'access_denied'],
  ]
  for (const [url, top, error] of cases) {
    const r = await req(url)
    const u = r.location ? new URL(r.location) : null
    check(`認証コールバック ${url} → ${top}?error=${error}`, r.status === 307 && u?.pathname === top && u.searchParams.get('error') === error, `実際: ${r.status} ${r.location}`)
  }
  // エラー表示がトップに出るか（4種類 × 3言語）。英語・ポルトガル語に日本語が混ざっていないか
  for (const l of LANGS) {
    for (const code of ['access_denied', 'no_code', 'analysis_failed', 'athlete_limit']) {
      const html = await (await req(`${l || '/'}?error=${code}`)).text()
      const msg = html.match(/<div class="[^"]*bg-red-500[^"]*">([^<]+)<\/div>/)?.[1] ?? ''
      const langOk = l === '' ? /[ぁ-んァ-ン一-龥]/.test(msg) : msg.length > 0 && !/[ぁ-んァ-ン一-龥]/.test(msg)
      check(`トップ${l}: ?error=${code} のメッセージを表示`, msg.length > 0 && langOk, msg || 'メッセージなし')
    }
  }
}

// 5. 結果ページ
async function checkResult(browser) {
  const { context, page, errors } = await newPage(browser, { width: 1280, height: 900 })
  const first = encodeResult(fakeResult('climber', { climbing: 85, speed: 50, endurance: 60, power: 0, consistency: 55 }))
  const second = encodeResult(fakeResult('granfondo', { climbing: 60, speed: 50, endurance: 88, power: 0, consistency: 58 }))

  // 予想を保存した状態で1回目
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.setItem('veloava_prediction', 'sprinter'))
  await page.goto(`${BASE}/result?data=${first}`, { waitUntil: 'networkidle' })
  // innerText は画面に見えている文字だけ（script タグの中身を含まない）。CSS の uppercase も反映されるので見出しは大文字小文字を区別せずに探す
  const body1 = await page.innerText('body')
  check('結果: ?data= を復元して表示（キャラ名と統計が画面に出る）', body1.includes('アルピナ・クロス') && body1.includes('2,400'), body1.slice(0, 300))
  // 名前は今は画面に出していないが、UTF-8 の復元が壊れていないかをページに渡すデータで確かめる
  check('結果: 日本語の名前が文字化けせずに復元される', (await page.content()).includes('山田 花子'))
  check('結果: スクリプトエラーなし', errors.length === 0, errors.join(' / '))
  check('結果: 一言コメント（Ride Insights）を表示', /ride insights/i.test(body1))
  check('結果: レーダーチャートを表示', (await page.locator('svg polygon').count()) >= 2)
  check('結果: 予想の答え合わせを表示（外れ）', body1.includes('意外な一面'))
  check('結果: 予想は一度だけ（表示後に消える）', (await page.evaluate(() => localStorage.getItem('veloava_prediction'))) === null)
  check('結果: 前回がないときは前回比較を出さない', !/character evolution/i.test(body1))
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('veloava_last_results') || '{}'))
  check('結果: 今回の結果をブラウザに保存（期間ごと）', stored['90']?.characterId === 'climber', JSON.stringify(stored))

  // シェアボタン
  const href = await page.getAttribute(X_SHARE, 'href')
  const { status, intent, shareUrl } = await followShare(href)
  check('結果: Xでポストは自サイトの中継を通して X の投稿画面へ転送', status === 307 && intent?.origin === 'https://x.com' && intent.pathname === '/intent/post', `${href} → ${status} ${intent}`)
  check(
    '結果: 投稿するシェアURL（/c/{キャラ}_{性別} + utm_campaign=user_share）',
    shareUrl?.pathname === '/c/climber_female' && shareUrl.searchParams.get('utm_campaign') === 'user_share' && shareUrl.searchParams.get('utm_source') === 'x',
    String(shareUrl),
  )
  check('結果: 投稿文にキャラ名が入る', !!intent?.searchParams.get('text')?.includes('アルピナ・クロス'), intent?.searchParams.get('text') ?? '')
  check('結果: Xでポストは通常のリンク（target=_blank）', (await page.getAttribute(X_SHARE, 'target')) === '_blank')
  const leaked = await externalLinksWithResult(page)
  check('結果: 外部へのリンクのURLに診断結果（キャラ・性別）が入っていない（GA の離脱クリック対策）', leaked.length === 0, leaked.join(', '))
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
    page.locator(`${X_SHARE} ~ button`).first().click(),
  ])
  check('結果: 保存ボタンでPNGをダウンロード（PC）', !!download && /\.png$/.test(download.suggestedFilename()), download?.suggestedFilename() ?? 'ダウンロードなし')

  // 2回目（同じ期間で別のキャラ）→ 前回との比較
  await page.goto(`${BASE}/result?data=${second}`, { waitUntil: 'networkidle' })
  const body2 = await page.innerText('body')
  check('結果: 2回目は前回との比較（Character Evolution）を表示', /character evolution/i.test(body2))
  // 前回比較が出ている状態でも、薄すぎる文字がないか（±0 の表示など、プレビューでは出ない部分）
  const faintEvo = await page.evaluate(() =>
    Array.from(document.querySelectorAll('body *'))
      .filter((e) => !e.closest('[data-logo]') && Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim()))
      .filter((e) => {
        const m = getComputedStyle(e).color.match(/^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/)
        return m && +m[1] > 200 && +m[2] > 200 && +m[3] > 200 && +m[4] > 0 && +m[4] < 0.5
      })
      .map((e) => `${e.textContent.trim().slice(0, 15)}(${getComputedStyle(e).color})`),
  )
  check('結果（前回比較あり）: 薄すぎる文字がない', faintEvo.length === 0, faintEvo.join(', '))
  check('結果: 予想がないときは答え合わせを出さない', !body2.includes('意外な一面') && !body2.includes('予想的中'))

  // 期間が違う診断（180日）とは比べない。予想が当たったときの表示も確かめる
  const other = fakeResult('climber', { climbing: 80, speed: 50, endurance: 60, power: 0, consistency: 55 })
  other.stats.periodDays = 180
  await page.evaluate(() => localStorage.setItem('veloava_prediction', 'climber'))
  await page.goto(`${BASE}/result?data=${encodeResult(other)}`, { waitUntil: 'networkidle' })
  const body3 = await page.innerText('body')
  check('結果: 期間が違う前回（90日）とは比較しない', !/character evolution/i.test(body3))
  check('結果: 予想が当たったときの表示（予想的中）', body3.includes('予想的中'))

  // ポルトガル語の結果ページ（?data=）
  await page.goto(`${BASE}/pt/result?data=${first}`, { waitUntil: 'networkidle' })
  const ptBody = await page.innerText('body')
  const pt = await followShare(await page.getAttribute(X_SHARE, 'href'))
  check('結果（ポルトガル語）: 表示され、シェアURLが /pt/c/...', /ride insights/i.test(ptBody) && pt.shareUrl?.pathname === '/pt/c/climber_female', String(pt.shareUrl))
  check('結果（ポルトガル語）: 外部へのリンクに診断結果が入っていない', (await externalLinksWithResult(page)).length === 0)

  // 英語の結果ページ
  await page.goto(`${BASE}/en/result?data=${first}`, { waitUntil: 'networkidle' })
  const en = await followShare(await page.getAttribute(X_SHARE, 'href'))
  check('結果（英語）: シェアURLが /en/c/...', en.shareUrl?.pathname === '/en/c/climber_female', String(en.shareUrl))

  // 中継に知らないキャラを渡したら、X ではなくトップへ
  const bad = await req('/api/share/x?c=unknown_male&lang=en')
  check('Xシェアの中継: 知らないキャラはトップ（/en）へ', bad.status === 307 && new URL(bad.location).pathname === '/en', `${bad.status} ${bad.location}`)
  // 余計な文字を足した c は受け付けない（UTM の上書きや、シェアURLの書き換えを防ぐ）
  for (const c of ['climber_female_x', 'climber_female_%3Futm_campaign%3Downer_post%23', 'climber_female%2F..%2F..%2F%2Fevil.com']) {
    const r = await req(`/api/share/x?c=${c}`)
    check(`Xシェアの中継: c=${c} はトップへ`, r.status === 307 && new URL(r.location).pathname === '/', `${r.status} ${r.location}`)
  }

  // 壊れた data・data なし
  for (const url of ['/result?data=broken!!', '/result']) {
    await page.goto(BASE + url, { waitUntil: 'networkidle' })
    check(`結果: ${url} はエラー表示（トップへ戻るリンク）`, (await page.locator('[data-ga-id="error_back_to_top"]').count()) > 0)
  }
  await context.close()
}

// 6. OGP・サイトマップ・robots
// いまの Web の定石（アイコン・マニフェスト・セキュリティヘッダー・canonical/hreflang・404・構造化データ）
async function checkWebBasics(browser) {
  for (const [file, type] of [['/favicon.ico', 'image/'], ['/icon.svg', 'image/svg'], ['/apple-touch-icon.png', 'image/png'], ['/icon-192.png', 'image/png'], ['/icon-512.png', 'image/png'], ['/manifest.webmanifest', 'manifest']]) {
    const r = await req(file)
    check(`${file} が開ける`, r.status === 200 && r.type.includes(type), `${r.status} ${r.type}`)
  }
  const manifest = JSON.parse(await (await req('/manifest.webmanifest')).text())
  check('マニフェスト: 名前・開始URL・192px と 512px のアイコン', manifest.name === 'VeloAva' && manifest.start_url === '/' && ['192x192', '512x512'].every((s) => manifest.icons.some((i) => i.sizes === s)))

  // セキュリティヘッダー（ページ・API・画像のどれにも付く）
  for (const url of ['/', '/en/c/climber_male', '/api/share/x?c=climber_male', '/og/ja.png']) {
    const res = await fetch(BASE + url, { redirect: 'manual' })
    const h = (k) => res.headers.get(k) ?? ''
    const ok = h('content-security-policy-report-only').includes("default-src 'self'") && h('x-content-type-options') === 'nosniff' && h('referrer-policy') === 'strict-origin-when-cross-origin' && h('x-frame-options') === 'DENY' && h('content-security-policy').includes("frame-ancestors 'none'") && h('permissions-policy').includes('camera=()') && !res.headers.has('x-powered-by')
    check(`セキュリティヘッダー ${url}`, ok, JSON.stringify(Object.fromEntries(res.headers)))
  }

  // CSP の違反レポートの受け口（Report-Only の報告先）。結果ページの URL が来てもログに data を出さない（ログはここでは見られないので、受け付けることだけ確かめる）
  const rep = await fetch(BASE + '/api/csp-report', { method: 'POST', headers: { 'content-type': 'application/csp-report' }, body: JSON.stringify({ 'csp-report': { 'document-uri': `${BASE}/result?data=secret`, 'violated-directive': 'img-src', 'blocked-uri': 'https://evil.example/x.png' } }) })
  check('CSP の違反レポートを受け付ける（204）', rep.status === 204, String(rep.status))

  // canonical と別言語版（hreflang）がページごとに正しいか
  const link = (html, rel, extra = '') => html.match(new RegExp(`<link rel="${rel}"${extra} href="([^"]*)"`))?.[1] ?? ''
  for (const [url, canonical, en] of [
    ['/', '/', '/en'],
    ['/pt', '/pt', '/en'],
    ['/privacy', '/privacy', '/en/privacy'],
    ['/en/c/climber_female?utm_source=x&utm_campaign=user_share', '/en/c/climber_female', '/en/c/climber_female'],
  ]) {
    const html = await (await req(url, { 'user-agent': 'Googlebot' })).text()
    const c = link(html, 'canonical')
    const alt = (lang) => html.match(new RegExp(`<link rel="alternate" hrefLang="${lang}" href="([^"]*)"`))?.[1] ?? ''
    check(`canonical・hreflang ${url}`, (c ? new URL(c).pathname : '') === canonical && !c.includes('utm_') && alt('en').endsWith(en) && alt('pt-BR') !== '' && alt('ja') !== '' && alt('x-default').endsWith(en), `canonical=${c} en=${alt('en')} ja=${alt('ja')} pt=${alt('pt-BR')} x=${alt('x-default')}`)
  }

  // 構造化データ（トップ）
  const top = await (await req('/', { 'user-agent': 'Googlebot' })).text()
  let ld = null
  try { ld = JSON.parse(top.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1] ?? '') } catch {}
  check('トップ: 構造化データ（WebApplication）', ld?.['@type'] === 'WebApplication' && ld.name === 'VeloAva')

  // プライバシーページはビルド時に静的に作られ、CDN でキャッシュされる（404 などで動的な値を使うと壊れる）
  const privacy = await fetch(BASE + '/en/privacy')
  check('プライバシーページが静的配信（Cache-Control に s-maxage）', (privacy.headers.get('cache-control') ?? '').includes('s-maxage'), privacy.headers.get('cache-control') ?? '')

  // 404 はサイトのデザイン・言語で出る（Next.js は404をストリーミングで描くので、HTML ではなくブラウザで表示を確かめる）
  const { context, page } = await newPage(browser, { width: 390, height: 844 })
  for (const [url, lang, text] of [['/no-such-page', 'ja', 'ページが見つかりません'], ['/en/no-such-page', 'en', 'Page not found'], ['/pt/no/such', 'pt-BR', 'Página não encontrada'], ['/fr', 'ja', 'ページが見つかりません'], ['/c/unknown_male', 'ja', 'ページが見つかりません'], ['/en/foo.png', 'en', 'Page not found']]) {
    const res = await page.goto(BASE + url, { waitUntil: 'networkidle' })
    const got = await page.evaluate(() => ({ lang: document.documentElement.lang, h1: document.querySelector('h1')?.innerText ?? '', bg: getComputedStyle(document.querySelector('main') ?? document.body).backgroundColor }))
    check(`404 ${url}: 404・lang="${lang}"・その言語の案内・サイトの背景色`, res.status() === 404 && got.lang === lang && got.h1 === text && got.bg === 'rgb(10, 10, 15)', `${res.status()} ${JSON.stringify(got)}`)
  }
  await context.close()
}

async function checkSeo() {
  const meta = (html, key) => html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`))?.[1] ?? ''
  for (const [url, img] of [['/', '/og/ja.png'], ['/en', '/og/en.png'], ['/pt', '/og/pt.png'], ['/privacy', '/og/ja.png']]) {
    const html = await (await req(url)).text()
    const og = meta(html, 'og:image')
    check(`OGP ${url}: og:image=${img}・twitter:card=summary_large_image`, og.endsWith(img) && meta(html, 'twitter:card') === 'summary_large_image', og)
    const r = await req(new URL(og, BASE).pathname)
    check(`OGP ${url}: 画像が開ける`, r.status === 200 && r.type.includes('image/png'), `${r.status} ${r.type}`)
  }
  for (const url of ['/c/weekend_female', '/en/c/climber_male']) {
    const html = await (await req(url, { 'user-agent': 'Twitterbot/1.0' })).text()
    const og = meta(html, 'og:image')
    const r = await req(new URL(og, BASE).pathname + new URL(og, BASE).search)
    check(`OGP ${url}: キャラ別画像が転送なしで開ける`, og.includes('opengraph-image') && r.status === 200 && r.type.includes('image/png'), `${og} → ${r.status} ${r.location}`)
  }
  const resHtml = await (await req('/result?preview=climber')).text()
  check('結果ページは noindex', meta(resHtml, 'robots').includes('noindex'))

  const sitemap = await (await req('/sitemap.xml')).text()
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  check('サイトマップ: 42件（3言語 × トップ・プライバシー・キャラ紹介12種）', locs.length === 42, `${locs.length}件`)
  check('サイトマップ: 結果ページを含まない', !locs.some((l) => l.includes('/result')))
  let dead = 0
  for (const l of locs) {
    const r = await req(new URL(l).pathname)
    if (r.status !== 200) dead++
  }
  check('サイトマップ: 全URLが 200 で開ける', dead === 0, `${dead}件が開けない`)
  // Google Search Console の所有権確認ファイル。Google は定期的に確認し直すので、消えたり転送されたりすると確認が外れる
  const gsc = await req('/googledef27e552d077cc2.html')
  check('Search Console の確認ファイルが 200 で開ける', gsc.status === 200 && (await gsc.text()).includes('google-site-verification: googledef27e552d077cc2.html'), `${gsc.status} ${gsc.location}`)

  const robots = await (await req('/robots.txt')).text()
  check('robots.txt: /api/ を除外しサイトマップを案内', robots.includes('Disallow: /api/') && /Sitemap: .*\/sitemap\.xml/.test(robots), robots)
}

async function isServerUp() {
  try {
    return (await fetch(BASE + '/robots.txt')).ok
  } catch {
    return false
  }
}

;(async () => {
  if (!process.argv.includes('--no-build')) {
    console.log('テスト用の設定でビルドします…')
    execSync('npx next build', { cwd: ROOT, env, stdio: ['ignore', 'ignore', 'inherit'] })
  }
  if (await isServerUp()) {
    console.error(`ポート ${PORT} ですでに何かが動いています。止めてから実行してください（例: pkill -f next-server）`)
    process.exit(1)
  }
  const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', String(PORT)], { cwd: ROOT, env, stdio: 'ignore' })
  let browser
  try {
    for (let i = 0; i < 60 && !(await isServerUp()); i++) await new Promise((r) => setTimeout(r, 1000))
    browser = await chromium.launch()
    console.log('\n## ページ'); await checkPages(browser)
    console.log('\n## 言語の振り分け'); await checkMiddleware()
    console.log('\n## Strava 認証'); await checkAuthStart(); await checkCallback()
    console.log('\n## 結果ページ'); await checkResult(browser)
    console.log('\n## OGP・サイトマップ'); await checkSeo()
    console.log('\n## Web の基本（アイコン・ヘッダー・canonical・404・構造化データ）'); await checkWebBasics(browser)
  } catch (e) {
    console.error(e)
    failures.push('実行エラー')
  } finally {
    if (browser) await browser.close()
    server.kill('SIGTERM')
  }
  console.log(failures.length ? `\n✗ ${failures.length} 件失敗` : '\n✓ アプリの動作チェックはすべて通りました')
  process.exit(failures.length ? 1 : 0)
})()
