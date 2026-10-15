/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Stravaのプロフィール画像ドメインを許可
    remotePatterns: [
      { protocol: 'https', hostname: '**.strava.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
    ],
  },
}

export default nextConfig
