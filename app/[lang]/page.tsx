// トップページ: アプリの説明・期間選択（Strava連携）・キャラ一覧
// URL は /（日本語）・/en・/pt。Next.js の決まりで app/[lang]/page.tsx が各言語のトップページになる。
// 文言はすべて辞書（lib/i18n/dictionaries）から取り、ここには日本語を直接書かない
// サーバーコンポーネントなので、ここではブラウザの機能（localStorage、クリック処理など）を使わない。
// 操作が必要な部分は 'use client' を付けた部品（_components/ 内）に切り出して埋め込んでいる

import Link from 'next/link'
import Image from 'next/image'
import DiagnosisStarter from './_components/DiagnosisStarter'
import LatestUpdate from './_components/LatestUpdate'
import { listCharacters } from '@/lib/characters'
import { getChangelog, type ChangelogEntry } from '@/lib/changelog'
import { getDictionary, localePath, type Locale, requireLocale } from '@/lib/i18n'
import { pageAlternates } from '@/lib/seo'
import type { Metadata } from 'next'

// ページ内だけで使う小さな部品は、別ファイルにせず同じファイルに関数として書いてよい
function ChangelogList({ entries, formatDate }: { entries: ChangelogEntry[]; formatDate: (ymd: string) => string }) {
  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li key={entry.date + entry.text} className="flex gap-3 text-white/70 leading-relaxed">
          <span className="flex-shrink-0 w-10 text-white/55">{formatDate(entry.date)}</span>
          <span>{entry.text}</span>
        </li>
      ))}
    </ul>
  )
}

// canonical と別言語版（hreflang）。タイトル・説明・OGP は layout.tsx の既定のまま
export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  return { alternates: pageAlternates(requireLocale(params.lang), '/') }
}

// ページの部品（page.tsx の default export）は、URL の動的セグメント（[lang]）を params、クエリ（?error=...）を searchParams として受け取れる
// Strava 認証に失敗すると /api/auth/callback が /?error=access_denied（英語なら /en?error=...）のようにここへ戻す
export default function HomePage({ params, searchParams }: { params: { lang: string }; searchParams: { error?: string } }) {
  // 知らない言語（/fr など）は 404（lib/i18n の requireLocale の説明を参照）
  const lang = requireLocale(params.lang)
  const t = getDictionary(lang)
  const changelog = getChangelog(lang)
  const errorMsg = searchParams.error ? t.home.errors[searchParams.error] : null
  // 構造化データ（JSON-LD）。検索エンジンに「無料のWebアプリ」であることを伝える（検索結果の表示に使われることがある）
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://veloava.vercel.app'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'VeloAva',
    url: baseUrl + localePath(lang, '/'),
    description: t.meta.description,
    inLanguage: t.htmlLang,
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
  }

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white">
      {/* JSON は自分で組み立てた値だけなので、そのまま埋め込んでよい（< を含む文字列は入らない） */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* ヒーローセクション */}
      <div className="relative overflow-hidden">
        {/* 背景グラデーション */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          {/* 最新の更新（以前に診断した人にだけ、公開から14日間） */}
          <LatestUpdate lang={lang} />

          {/* ロゴ・タイトル */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-orange-400 mb-8">
            <span>🚴</span>
            <span>{t.home.badge}</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              VeloAva
            </span>
            <br />
            {t.home.titleLine1}<br />{t.home.titleLine2}
          </h1>

          <p className="text-lg text-white/60 mb-12 max-w-xl mx-auto">
            {t.home.lead}
          </p>

          {/* エラーメッセージ（OAuth失敗時） */}
          {errorMsg && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          {/* タイプ予想 → 期間選択（Strava連携） */}
          <DiagnosisStarter lang={lang} />

          {/* 連携をためらう人向けの安心材料 */}
          <ul className="mt-8 mx-auto max-w-md space-y-2 text-left text-sm text-white/60">
            {/* 文言は辞書、アイコンだけここで並べる。map の第2引数 i は何番目か（0から） */}
            {['🔒', '🔌', '👀'].map((icon, i) => ({ icon, text: t.home.trust[i] })).map((item) => (
              <li key={item.icon} className="flex gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span aria-hidden>{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
          <Link href={localePath(lang, '/privacy')} data-ga-event="ui_click" data-ga-id="trust_privacy_link" className="mt-3 inline-block py-1.5 text-xs text-white/55 underline underline-offset-2 hover:text-white/70">
            {t.home.readPrivacy}
          </Link>
        </div>
      </div>

      {/* キャラクタープレビューセクション */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-10 text-white/80">
          {t.home.typesTitle}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {listCharacters(lang).map((c) => (
            <div
              key={c.id}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/8 transition-colors group"
            >
              {/* 顔部分のクロップ表示 */}
              <div className="relative h-36 overflow-hidden">
                <div
                  className="absolute inset-0 opacity-25"
                  style={{ background: `radial-gradient(circle at 50% 60%, ${c.accentColor}, transparent 70%)` }}
                />
                <Image
                  src={`/characters/${c.id}_male.png`}
                  alt={c.typeName}
                  fill
                  // 表示される幅（スマホは画面の半分、PCはカード1枚の幅）。指定しないと画面幅いっぱいの大きな画像を読み込む
                  sizes="(min-width: 768px) 280px, 50vw"
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              {/* キャラ名 */}
              <div className="px-4 py-3 text-center">
                <div className="font-bold text-sm">{c.typeName}</div>
                <div className="text-xs mt-0.5" style={{ color: c.accentColor }}>{c.tagline}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 診断の仕組みセクション */}
      <div className="max-w-4xl mx-auto px-6 py-8 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10 text-white/80">
          {t.home.howTitle}
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {['🔗', '📊', '🎉'].map((icon, i) => ({ icon, ...t.home.how[i] })).map((item) => (
            <div
              key={item.title}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-white/55">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* フッター */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-white/55">
        {/* 更新履歴（ファーストビューの「NEW」からここへ飛ぶ） */}
        <section id="changelog" className="max-w-xl mx-auto px-6 mb-6 text-left scroll-mt-6">
          <h2 className="text-sm font-bold text-white/55 mb-3">{t.home.changelogTitle}</h2>
          <ChangelogList entries={changelog.slice(0, 3)} formatDate={t.formatShortDate} />
          {changelog.length > 3 && (
            <details className="mt-2 group">
              <summary className="cursor-pointer list-none text-white/55 hover:text-white/80 underline underline-offset-2 group-open:hidden">
                {t.home.showAll(changelog.length)}
              </summary>
              <div className="mt-2">
                <ChangelogList entries={changelog.slice(3)} formatDate={t.formatShortDate} />
              </div>
            </details>
          )}
        </section>
        <p>{t.home.footerNote}</p>
        <Link href={localePath(lang, '/privacy')} data-ga-event="ui_click" data-ga-id="privacy_link" className="mt-1 inline-block py-1.5 hover:text-white/80 transition-colors underline underline-offset-2">
          {t.home.privacy}
        </Link>
      </footer>
    </main>
  )
}
