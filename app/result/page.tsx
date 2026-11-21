// 結果ページ（/result?data=...）。サーバーで URL の data を復元し、表示用の部品に渡すだけの薄いページ。
// 流れ: Strava 認証のコールバック → /result?data=<Base64urlにした診断結果> → ここで復元 → ResultView が表示
// 出てくる概念: searchParams、サーバーコンポーネントからクライアントコンポーネントへの props の受け渡し
// @/ は tsconfig.json の paths で「リポジトリのルート」を指す別名（../../lib のような相対パスを書かずに済む）
import { getResultPageData } from '@/lib/result-data'
import { shareSlug } from '@/lib/share'
import ResultView from './_components/ResultView'
import ResultErrorView from './_components/ResultErrorView'

// ResultView は 'use client' の部品（localStorage を使うため）。サーバーで復元・計算した結果を props で渡している。
// props で渡せるのは JSON にできる値（文字列・数値・配列・オブジェクト）だけ。関数やクラスは渡せない
export default function ResultPage({ searchParams }: { searchParams: { data?: string; preview?: string; sex?: string } }) {
  const data = getResultPageData(searchParams)
  if (data.status !== 'ok') return <ResultErrorView status={data.status} />
  return (
    <ResultView
      result={data.result}
      insights={data.insights}
      sharePath={`/c/${shareSlug(data.result.characterId, data.result.sex)}`}
      isPreview={data.isPreview}
    />
  )
}
