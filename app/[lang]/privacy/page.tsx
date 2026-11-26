// プライバシーポリシーページ（URL は /privacy、英語は /en/privacy、ポルトガル語は /pt/privacy）
// 中身が固定なので、ビルド時に一度だけHTMLを作る静的ページになる（アクセスのたびにサーバーで作らない）。
// Strava の本番申請やユーザーへの説明に使う。計測やデータの扱いを変えたら、_content/ の3言語とも必ず合わせて直す
// 本文は長い文章で辞書に入れにくいため、言語ごとに部品（_content/ja.tsx など）として書き、ここで選んで表示している

import Link from 'next/link'
import type { Metadata } from 'next'
import { pageAlternates } from '@/lib/seo'
import { getDictionary, localePath, type Locale } from '@/lib/i18n'
import PrivacyJa from './_content/ja'
import PrivacyEn from './_content/en'
import PrivacyPt from './_content/pt'

// 言語 → 本文の部品。Record<Locale, ...> なので、言語を増やしたときに書き忘れると型エラーになる
const CONTENT: Record<Locale, () => JSX.Element> = { ja: PrivacyJa, en: PrivacyEn, pt: PrivacyPt }

// このページだけの <title>。layout.tsx の generateMetadata を上書きする
export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = params.lang as Locale
  return { title: getDictionary(lang).privacy.metaTitle, alternates: pageAlternates(lang, '/privacy') }
}

export default function PrivacyPage({ params }: { params: { lang: string } }) {
  const lang = params.lang as Locale
  const t = getDictionary(lang).privacy
  const Content = CONTENT[lang] // 大文字で始まる変数に入れると <Content /> として部品のように使える

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-2xl mx-auto px-6 pt-14 pb-20">

        {/* ヘッダー */}
        <div className="mb-10">
          <Link href={localePath(lang, '/')} data-ga-event="ui_click" data-ga-id="privacy_back_top" className="inline-block py-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">{t.backTop}</Link>
          <h1 className="text-2xl font-black mt-4 mb-1">{t.title}</h1>
          <p className="text-xs text-white/30">{t.updated}</p>
        </div>

        <Content />

        <div className="text-center mt-12">
          <Link href={localePath(lang, '/')} data-ga-event="ui_click" data-ga-id="privacy_back_bottom" className="inline-block py-1.5 text-sm text-orange-400 hover:underline">{t.backBottom}</Link>
        </div>
      </div>
    </main>
  )
}
