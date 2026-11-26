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

async function newPage(browser, viewport) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text())
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
    const ok = res.status() === 200 && errors.length === 0 && brokenImages.length === 0
    if (!ok) {
      bad++
      check(`ページ ${p}`, false, `status=${res.status()} errors=${errors.join(' / ')} broken=${brokenImages.join(', ')}`)
    }
  }
  check(`全ページ（${paths.length}件）が 200・エラーなし・画像の読み込み成功`, bad === 0)
  await context.close()

  // スマホ幅で横にはみ出さないか（主要ページだけ）
  const mobile = await newPage(browser, { width: 390, height: 844 })
  for (const l of LANGS) {
    for (const p of [l || '/', `${l}/c/climber_female`, `${l}/result?preview=climber&sex=female`, `${l}/privacy`]) {
      await mobile.page.goto(BASE + p, { waitUntil: 'networkidle' })
      const overflow = await mobile.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      check(`スマホ幅 ${p}: 横にはみ出さない`, overflow <= 1, `はみ出し ${overflow}px`)
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
    ['/result?preview=climber', { 'accept-language': 'en-US' }, 200, ''],
    ['/privacy', { 'accept-language': 'en-US' }, 200, ''],
    ['/ja/privacy', {}, 307, '/privacy'],
    ['/ja', {}, 307, '/'],
    ['/en', { 'accept-language': 'ja' }, 200, ''],
    ['/fr', {}, 404, ''],
    ['/c/unknown_male', {}, 404, ''],
    ['/c/climber_other', {}, 404, ''],
  ]
  for (const [url, headers, status, loc] of cases) {
    const r = await req(url, headers)
    const locOk = !loc || new URL(r.location, BASE).pathname === loc
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
  // エラー表示がトップに出るか
  const html = await (await req('/?error=access_denied')).text()
  check('トップ: ?error= のエラーメッセージを表示', /bg-red-500/.test(html))
}

// 5. 結果ページ
async function checkResult(browser) {
  const { context, page, errors } = await newPage(browser, { width: 1280, height: 900 })
  const first = encodeResult(fakeResult('climber', { climbing: 85, speed: 50, endurance: 60, power: 0, consistency: 55 }))
  const second = encodeResult(fakeResult('granfondo', { climbing: 60, speed: 52, endurance: 88, power: 0, consistency: 58 }))

  // 予想を保存した状態で1回目
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.setItem('veloava_prediction', 'sprinter'))
  await page.goto(`${BASE}/result?data=${first}`, { waitUntil: 'networkidle' })
  const body1 = await page.textContent('body')
  check('結果: ?data= を復元して表示（日本語の名前も文字化けしない）', body1.includes('山田 花子'), body1.slice(0, 200))
  check('結果: スクリプトエラーなし', errors.length === 0, errors.join(' / '))
  check('結果: 一言コメント（Ride Insights）を表示', body1.includes('Ride Insights'))
  check('結果: レーダーチャートを表示', (await page.locator('svg').count()) > 0)
  check('結果: 予想の答え合わせを表示（外れ）', body1.includes('意外な一面'))
  check('結果: 予想は一度だけ（表示後に消える）', (await page.evaluate(() => localStorage.getItem('veloava_prediction'))) === null)
  check('結果: 前回がないときは前回比較を出さない', !body1.includes('Character Evolution'))
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('veloava_last_results') || '{}'))
  check('結果: 今回の結果をブラウザに保存（期間ごと）', stored['90']?.characterId === 'climber', JSON.stringify(stored))

  // シェアボタン
  const href = await page.getAttribute('a[href*="x.com/intent"]', 'href')
  const shareUrl = href ? new URL(new URL(href).searchParams.get('url') ?? '', BASE) : null
  check(
    '結果: Xでポストのリンク（/c/{キャラ}_{性別} + utm_campaign=user_share）',
    shareUrl?.pathname === '/c/climber_female' && shareUrl.searchParams.get('utm_campaign') === 'user_share' && shareUrl.searchParams.get('utm_source') === 'x',
    href ?? 'リンクなし',
  )
  check('結果: Xでポストは通常のリンク（target=_blank）', (await page.getAttribute('a[href*="x.com/intent"]', 'target')) === '_blank')
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
    page.locator('a[href*="x.com/intent"] ~ button').first().click(),
  ])
  check('結果: 保存ボタンでPNGをダウンロード（PC）', !!download && /\.png$/.test(download.suggestedFilename()), download?.suggestedFilename() ?? 'ダウンロードなし')

  // 2回目（同じ期間で別のキャラ）→ 前回との比較
  await page.goto(`${BASE}/result?data=${second}`, { waitUntil: 'networkidle' })
  const body2 = await page.textContent('body')
  check('結果: 2回目は前回との比較（Character Evolution）を表示', body2.includes('Character Evolution'))
  check('結果: 予想がないときは答え合わせを出さない', !body2.includes('意外な一面') && !body2.includes('予想的中'))

  // 英語の結果ページ
  await page.goto(`${BASE}/en/result?data=${first}`, { waitUntil: 'networkidle' })
  const enHref = await page.getAttribute('a[href*="x.com/intent"]', 'href')
  check('結果（英語）: シェアURLが /en/c/...', !!enHref && new URL(new URL(enHref).searchParams.get('url') ?? '', BASE).pathname === '/en/c/climber_female', enHref ?? '')

  // 壊れた data・data なし
  for (const url of ['/result?data=broken!!', '/result']) {
    await page.goto(BASE + url, { waitUntil: 'networkidle' })
    check(`結果: ${url} はエラー表示（トップへ戻るリンク）`, (await page.locator('[data-ga-id="error_back_to_top"]').count()) > 0)
  }
  await context.close()
}

// 6. OGP・サイトマップ・robots
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
