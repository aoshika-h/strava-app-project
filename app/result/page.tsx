import { getResultPageData } from '@/controllers/resultController'
import { shareSlug } from '@/controllers/shareController'
import ResultView from '@/views/result/ResultView'
import ResultErrorView from '@/views/result/ResultErrorView'

export default function ResultPage({ searchParams }: { searchParams: { data?: string; preview?: string; sex?: string } }) {
  const data = getResultPageData(searchParams)
  if (data.status !== 'ok') return <ResultErrorView status={data.status} />
  return (
    <ResultView
      result={data.result}
      sharePath={`/c/${shareSlug(data.result.characterId, data.result.sex)}`}
      isPreview={data.isPreview}
    />
  )
}
