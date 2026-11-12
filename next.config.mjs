/** @type {import('next').NextConfig} */
const nextConfig = {
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
      '/c/[slug]/opengraph-image': ['./public/characters/**'],
    },
  },
}

export default nextConfig
