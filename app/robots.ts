// robots.txt（/robots.txt）。Next.js の決まりで app/robots.ts が自動でテキストになる
// API（Strava 認証）は巡回させない。サイトマップの場所を伝える
import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://veloava.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
