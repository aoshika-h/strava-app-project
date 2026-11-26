// 全ページに付けるセキュリティ用のレスポンスヘッダー（いまのWebの標準的な設定）
// - nosniff: ファイルの種類をブラウザに推測させない（画像やテキストをスクリプトとして実行させない）
// - Referrer-Policy: 外部サイトへ移るときは、URL全体ではなくドメインだけを伝える（結果ページの ?data= を外に出さない）
// - X-Frame-Options / frame-ancestors: 他のサイトに iframe で埋め込ませない（クリックジャッキング対策）
// - Permissions-Policy: 使わない機能（カメラ・マイク・位置情報など）を無効にしておく
// HTTPS の強制（HSTS）は Vercel が自動で付ける。CSP（読み込めるスクリプトの制限）は GA の読み込みと両立させる調整が要るので、まだ入れていない
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 応答ヘッダーで Next.js を使っていることを知らせない（攻撃の手がかりを減らす）
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  images: {
    // Stravaのプロフィール画像ドメインを許可
    remotePatterns: [
      { protocol: 'https', hostname: '**.strava.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
    ],
  },
  experimental: {
    // OGP画像生成でキャラ画像をfsから読むため、サーバーレス関数にバンドルする
    outputFileTracingIncludes: {
      '/[lang]/c/[slug]/opengraph-image': ['./public/characters/**'],
    },
  },
}

export default nextConfig
