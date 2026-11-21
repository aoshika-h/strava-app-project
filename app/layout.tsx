// ルートレイアウト: 全ページ共通のHTMLラッパー
// Next.js の決まりで app/layout.tsx はすべてのページを包む外枠になる（<html> と <body> はここにだけ書く）。
// 各ページの page.tsx の中身が、下の RootLayout の children として差し込まれる。
// 出てくる概念: metadata（<head> の自動生成）、next/font、<Script strategy>、環境変数 NEXT_PUBLIC_*

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import ClickTracker from '@/components/ClickTracker'
import './globals.css'

// NEXT_PUBLIC_ で始まる環境変数はビルド時にコードへ埋め込まれ、ブラウザ側のコードからも読める。
// それ以外（STRAVA_CLIENT_SECRET など）はサーバー側だけで読めて、ブラウザには漏れない
const GA_ID = process.env.NEXT_PUBLIC_GA_ID

// next/font はビルド時にフォントを取得して自サイトから配信する（Google への外部リクエストやちらつきを防ぐ）
const inter = Inter({ subsets: ['latin'] })

// metadata を export すると、Next.js が <title> や OGP の <meta> タグを自動で <head> に出力する。
// layout の値は全ページの既定値で、各ページの metadata / generateMetadata で上書きできる
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

// 'use client' が付いていないので、これはサーバーコンポーネント（サーバーでHTMLを作るだけで、ブラウザ用のJSは最小限）。
// GA_ID があるときだけ GA のスクリプトを入れる。<Script strategy="afterInteractive"> は、ページが操作できる状態になった後に
// 読み込む指定（計測タグで表示を遅らせないため）。id 付きの <Script> の中身は、テンプレート文字列のJSがそのまま実行される。
// ClickTracker は画面に何も描かない部品で、ページ全体のクリックを見張るために全ページ共通でここに置いている
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
                // ユーザーのXシェアから来た人の着地（CV）。シェアURLの utm_campaign=user_share で見分ける
                if (location.pathname.indexOf('/c/') === 0 && params.get('utm_campaign') === 'user_share') {
                  gtag('event', 'share_inflow');
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
