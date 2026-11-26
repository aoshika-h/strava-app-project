// ファビコンとホーム画面用アイコンを作る: public/icon.svg・favicon.ico・apple-touch-icon.png・icon-192.png・icon-512.png
// 使い方: node scripts/generate-icons.cjs（デザインを変えたら SVG を直して作り直す）
// デザイン: サイトの背景色の角丸の四角に、ロゴと同じオレンジ→赤のグラデーションの「V」
// 前提: Playwright（require('playwright')）と Python の Pillow（ICO の書き出しに使う）
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { chromium } = require('playwright')

const PUBLIC = path.resolve(__dirname, '..', 'public')

// maskable（Android のホーム画面で丸や角丸に切り抜かれる）でも欠けないよう、V は中央80%の内側に収める
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fb923c"/>
      <stop offset="1" stop-color="#ef4444"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="#0A0A0F"/>
  <path d="M118 128h86l52 168 52-168h86L300 392h-88z" fill="url(#g)"/>
</svg>
`

;(async () => {
  fs.writeFileSync(path.join(PUBLIC, 'icon.svg'), SVG)
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const png = async (size, file, { square = false } = {}) => {
    // apple-touch-icon は iOS が自分で角を丸めるので、角丸なし（四角いっぱいに背景色）で作る
    const svg = square ? SVG.replace('rx="112"', 'rx="0"') : SVG
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`)
    await page.screenshot({ path: path.join(PUBLIC, file), omitBackground: true })
  }
  await png(180, 'apple-touch-icon.png', { square: true })
  await png(192, 'icon-192.png')
  await png(512, 'icon-512.png')
  await png(64, '.favicon-64.png')
  await browser.close()
  // favicon.ico（16・32・48px を1つにまとめる）
  execFileSync('python3', ['-I', '-c', `
from PIL import Image
im = Image.open(${JSON.stringify(path.join(PUBLIC, '.favicon-64.png'))})
im.save(${JSON.stringify(path.join(PUBLIC, 'favicon.ico'))}, sizes=[(16,16),(32,32),(48,48)])
`])
  fs.unlinkSync(path.join(PUBLIC, '.favicon-64.png'))
  console.log('wrote public/icon.svg, favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png')
})()
