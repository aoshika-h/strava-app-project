import { getResultPageData } from '@/lib/result-data'
import { shareSlug } from '@/lib/share'
import ResultView from './_components/ResultView'
import ResultErrorView from './_components/ResultErrorView'

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
