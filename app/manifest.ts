// Web アプリマニフェスト（/manifest.webmanifest）。Next.js の決まりで app/manifest.ts が自動で JSON になり、<head> にリンクされる
// スマホの「ホーム画面に追加」で使う名前・アイコン・色。middleware は拡張子付きのパスを対象外にしているので、言語の振り分けは通らない
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VeloAva',
    short_name: 'VeloAva',
    description: 'Strava のライドデータから、あなたの脚質をキャラクターで診断します',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0F',
    theme_color: '#0A0A0F',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      // Android のホーム画面で丸や角丸に切り抜かれる用（V は中央に余白を取ってある）
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  }
}
