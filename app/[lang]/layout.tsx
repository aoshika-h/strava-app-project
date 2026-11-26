// ルートレイアウト: 全ページ共通のHTMLラッパー
// Next.js の決まりで、いちばん外側の layout.tsx がすべてのページを包む外枠になる（<html> と <body> はここにだけ書く）。
// 多言語化のため app/[lang]/layout.tsx に置いている。[lang] は「動的セグメント」で、URL の言語部分（ja / en / pt）が params.lang に入る。
// 日本語の URL には /ja が付かないが、middleware.ts が内部で /ja/... に書き換えて（rewrite）ここに届けている
// 各ページの page.tsx の中身が、下の RootLayout の children として差し込まれる。
// 出てくる概念: generateMetadata（<head> の自動生成）、generateStaticParams、next/font、<Script strategy>、環境変数 NEXT_PUBLIC_*

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import ClickTracker from '@/components/ClickTracker'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { LOCALES, getDictionary, isLocale } from '@/lib/i18n'
import '../globals.css'

// NEXT_PUBLIC_ で始まる環境変数はビルド時にコードへ埋め込まれ、ブラウザ側のコードからも読める。
// それ以外（STRAVA_CLIENT_SECRET など）はサーバー側だけで読めて、ブラウザには漏れない
const GA_ID = process.env.NEXT_PUBLIC_GA_ID

// next/font はビルド時にフォントを取得して自サイトから配信する（Google への外部リクエストやちらつきを防ぐ）
const inter = Inter({ subsets: ['latin'] })

// 3言語ぶんのページをビルド時に用意しておく指定（URL の [lang] に入りうる値の一覧）
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

// generateMetadata を export すると、Next.js が <title> や OGP の <meta> タグを自動で <head> に出力する。
// 言語で文言が変わるので、固定の metadata ではなく params を受け取る関数にしている。
// layout の値は全ページの既定値で、各ページの metadata / generateMetadata で上書きできる
export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : 'ja'
  const t = getDictionary(lang)
  return {
    // プレビューデプロイではOGP画像のURLを本番ではなく自身のURLに向ける
    metadataBase: new URL(
      process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000',
    ),
    title: t.meta.title,
    description: t.meta.description,
    // 検索エンジンに「同じページの別言語版」を伝える（hreflang）。x-default は言語が合わない人向けの既定
    alternates: {
      languages: { ja: '/', en: '/en', 'pt-BR': '/pt', 'x-default': '/en' },
    },
    // OGP画像は言語ごとの静的画像（public/og/{lang}.png、scripts/generate-og.cjs で作る）。
    // キャラ紹介ページ（/c/...）は opengraph-image.tsx のキャラ別画像がこれより優先される
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      type: 'website',
      siteName: 'VeloAva',
      locale: t.ogLocale,
      images: [{ url: `/og/${lang}.png`, width: 1200, height: 630, alt: t.meta.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t.meta.title,
      description: t.meta.description,
      images: [`/og/${lang}.png`],
    },
  }
}

// 'use client' が付いていないので、これはサーバーコンポーネント（サーバーでHTMLを作るだけで、ブラウザ用のJSは最小限）。
// GA_ID があるときだけ GA のスクリプトを入れる。<Script strategy="afterInteractive"> は、ページが操作できる状態になった後に
// 読み込む指定（計測タグで表示を遅らせないため）。id 付きの <Script> の中身は、テンプレート文字列のJSがそのまま実行される。
// ClickTracker は画面に何も描かない部品で、ページ全体のクリックを見張るために全ページ共通でここに置いている
export default function RootLayout({ children, params }: { children: React.ReactNode; params: { lang: string } }) {
  // 知らない言語（/fr など）は 404。isLocale を通ると、以降 params.lang は Locale 型として扱える
  if (!isLocale(params.lang)) notFound()
  const lang = params.lang
  return (
    <html lang={getDictionary(lang).htmlLang}>
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
                // キャラ紹介ページは /c/...（日本語）・/en/c/...・/pt/c/... のどれか
                // ここはテンプレート文字列の中なので、正規表現の \\ は二重に書く（\/ のままだと / になり、構文エラーでGA全体が動かなくなる）
                if (/^(\\/(en|pt))?\\/c\\//.test(location.pathname) && params.get('utm_campaign') === 'user_share') {
                  gtag('event', 'share_inflow');
                }
              })();
            `}</Script>
          </>
        )}
        <ClickTracker />
        <LanguageSwitcher current={lang} />
        {children}
      </body>
    </html>
  )
}
