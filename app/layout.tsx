// ルートレイアウト: 全ページ共通のHTMLラッパー

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import ClickTracker from '@/views/common/ClickTracker'
import './globals.css'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  // プレビューデプロイではOGP画像のURLを本番ではなく自身のURLに向ける
  metadataBase: new URL(
    process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000',
  ),
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
              // 結果ページのプレビュー表示（?preview=）は動作確認用なので計測しない。config しなければイベントも送られない
              (function () {
                var params = new URLSearchParams(location.search);
                if (params.has('preview')) return;
                // Strava 認証から戻ったとき、診断開始時の client_id を引き継いで同じ人として計測し、URL からは消す
                var cid = params.get('cid');
                if (cid && /^\\d{1,20}\\.\\d{1,20}$/.test(cid)) {
                  gtag('config', '${GA_ID}', { client_id: cid });
                  params.delete('cid');
                  var qs = params.toString();
                  history.replaceState(history.state, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
                } else {
                  gtag('config', '${GA_ID}');
                }
              })();
            `}</Script>
          </>
        )}
        <ClickTracker />
        {children}
      </body>
    </html>
  )
}
