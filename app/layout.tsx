// ルートレイアウト: 全ページ共通のHTMLラッパー

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VeloAva — あなたのサイクリストキャラクターを診断',
  description: 'Stravaのライドデータを分析して、あなたのサイクリストアバターを診断します',
  openGraph: {
    title: 'VeloAva — あなたのサイクリストキャラクターを診断',
    description: 'Stravaのライドデータを分析して、あなたのサイクリストアバターを診断します',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="gtag-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}</Script>
          </>
        )}
        {children}
      </body>
    </html>
  )
}
