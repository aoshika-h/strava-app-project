// 全ページに付けるセキュリティ用のレスポンスヘッダー（いまのWebの標準的な設定）
// - nosniff: ファイルの種類をブラウザに推測させない（画像やテキストをスクリプトとして実行させない）
// - Referrer-Policy: 外部サイトへ移るときは、URL全体ではなくドメインだけを伝える（結果ページの ?data= を外に出さない）
// - X-Frame-Options / frame-ancestors: 他のサイトに iframe で埋め込ませない（クリックジャッキング対策）
// - Permissions-Policy: 使わない機能（カメラ・マイク・位置情報など）を無効にしておく
// HTTPS の強制（HSTS）は Vercel が自動で付ける
//
// CSP（読み込んでよい場所の制限）は、まず Report-Only（違反してもブロックせず /api/csp-report に報告だけ）で入れている。
// Vercel のログの [csp-report] を見て、正しい読み込み（GA・画像・シェアカードの保存など）が引っかかっていなければ、
// キーを Content-Security-Policy に変えて本当にブロックする。外部から読み込むのは GA（googletagmanager・google-analytics）だけ。
// script の 'unsafe-inline' は、Next.js と GA の初期化がページ内のスクリプトを使うため（なくすには nonce 方式への作り替えが要る）
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  // GA の Google シグナルが有効だと doubleclick と www.google.com にも送る（国別ドメイン www.google.co.jp などは Report-Only のログで確かめてから足す）
  "img-src 'self' data: blob: https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.g.doubleclick.net https://www.google.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.g.doubleclick.net https://www.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'report-uri /api/csp-report',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy-Report-Only', value: csp },
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
