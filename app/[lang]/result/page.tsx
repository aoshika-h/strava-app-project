// 結果ページ（/result?data=...、英語は /en/result?data=...）。サーバーで URL の data を復元し、表示用の部品に渡すだけの薄いページ。
// 流れ: Strava 認証のコールバック → /result?data=<Base64urlにした診断結果> → ここで復元 → ResultView が表示
// 出てくる概念: searchParams、サーバーコンポーネントからクライアントコンポーネントへの props の受け渡し
// @/ は tsconfig.json の paths で「リポジトリのルート」を指す別名（../../lib のような相対パスを書かずに済む）
import { getResultPageData } from '@/lib/result-data'
import { shareSlug } from '@/lib/share'
import { localePath, type Locale } from '@/lib/i18n'
import ResultView from './_components/ResultView'
import ResultErrorView from './_components/ResultErrorView'
import type { Metadata } from 'next'

// 結果ページは個人の診断結果（URLに名前や数値が入る）なので検索エンジンに載せない。サイトマップにも入れていない
export const metadata: Metadata = { robots: { index: false, follow: false } }

// ResultView は 'use client' の部品（localStorage を使うため）。サーバーで復元・計算した結果を props で渡している。
// props で渡せるのは JSON にできる値（文字列・数値・配列・オブジェクト）だけ。関数やクラスは渡せない
export default function ResultPage({
  params,
  searchParams,
}: {
  params: { lang: string }
  searchParams: { data?: string; preview?: string; sex?: string }
}) {
  const lang = params.lang as Locale
  const data = getResultPageData(searchParams, lang)
  if (data.status !== 'ok') return <ResultErrorView lang={lang} status={data.status} />
  return (
    <ResultView
      lang={lang}
      result={data.result}
      insights={data.insights}
      sharePath={localePath(lang, `/c/${shareSlug(data.result.characterId, data.result.sex)}`)}
      isPreview={data.isPreview}
    />
  )
}
