// ルートレイアウト: 全ページ共通のHTMLラッパー

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Strava キャラクター診断',
  description: 'あなたのStravaライドデータを分析して、サイクリストタイプを診断します',
  openGraph: {
    title: 'Strava キャラクター診断',
    description: 'あなたのStravaライドデータを分析して、サイクリストタイプを診断します',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
