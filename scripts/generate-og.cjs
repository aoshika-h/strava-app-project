// サイト全体のOGP画像（1200×630）を言語ごとに作る: public/og/{ja,en,pt}.png
// 使い方: node scripts/generate-og.cjs
// トップ・プライバシー・結果ページなどで使う（キャラ紹介ページ /c/... は opengraph-image.tsx のキャラ別画像が優先される）。
// 文言はトップの見出し（lib/i18n/dictionaries/*.ts の home.titleLine1 と titleLine2 をつないだもの）に合わせている。見出しを変えたらここも直して作り直す。
// Strava 公認と受け取れないよう、画像には Strava の名前やロゴを入れない。
//
// 前提: Playwright が require('playwright') で読めること。フォントは Google Fonts の Noto Sans JP を読み込む

const path = require('node:path')
const fs = require('node:fs')
const { chromium } = require('playwright')

const ROOT = path.resolve(__dirname, '..')
const CHAR_DIR = path.join(ROOT, 'public', 'characters')
const OUT_DIR = path.join(ROOT, 'public', 'og')

const TEXT = {
  ja: { title: 'あなたのサイクリストキャラクターを診断', sub: '6タイプ × 男女 12キャラ' },
  en: { title: 'Discover your cyclist character', sub: '6 types · 12 characters' },
  pt: { title: 'Descubra seu personagem ciclista', sub: '6 tipos · 12 personagens' },
}

// 上の段に男性版、下の段に女性版。色は lib/characters/data.ts の accentColor
const TYPES = [
  ['climber', '#10B981'],
  ['sprinter', '#F59E0B'],
  ['tt', '#3B82F6'],
  ['granfondo', '#8B5CF6'],
  ['allrounder', '#FC4C02'],
  ['weekend', '#EC4899'],
]

// setContent したページからはローカルファイルを読めないので、画像は data URI で埋め込む
function dataUri(id, sex) {
  return 'data:image/png;base64,' + fs.readFileSync(path.join(CHAR_DIR, `${id}_${sex}.png`)).toString('base64')
}

function html(t) {
  const cell = (id, sex, color) =>
    `<div class="c" style="--c:${color}"><img src="${dataUri(id, sex)}"></div>`
  const row = (sex) => `<div class="row">${TYPES.map(([id, c]) => cell(id, sex, c)).join('')}</div>`
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:'Noto Sans JP',sans-serif;color:#fff;
  background:radial-gradient(ellipse at 15% 0%,rgba(252,76,2,.28),transparent 55%),linear-gradient(135deg,#0A0A0F 0%,#12122a 100%);
  display:flex;flex-direction:column;align-items:center;padding:38px 40px 0}
.logo{font-size:84px;font-weight:900;line-height:1;letter-spacing:.01em;background:linear-gradient(90deg,#fb923c,#ef4444);-webkit-background-clip:text;color:transparent}
.title{font-size:44px;font-weight:900;margin-top:14px;line-height:1.2;text-align:center}
.sub{font-size:22px;font-weight:700;color:#a1a1b5;margin-top:10px}
.grid{display:flex;flex-direction:column;gap:10px;margin-top:26px}
.row{display:flex;gap:12px}
.c{width:176px;height:150px;border-radius:14px;overflow:hidden;border:2px solid var(--c);background:#000;display:flex;align-items:center;justify-content:center}
.c img{width:100%;height:100%;object-fit:cover}
</style></head><body>
<div class="logo">VeloAva</div>
<div class="title">${t.title}</div>
<div class="sub">${t.sub}</div>
<div class="grid">${row('male')}${row('female')}</div>
</body></html>`
}

;(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  for (const [lang, t] of Object.entries(TEXT)) {
    await page.setContent(html(t), { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    const out = path.join(OUT_DIR, `${lang}.png`)
    await page.screenshot({ path: out })
    console.log('wrote', path.relative(ROOT, out))
  }
  await browser.close()
})()
