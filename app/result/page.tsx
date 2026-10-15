// 結果ページのサーバーコンポーネント
// useSearchParams()を使うResultContentをSuspenseで包む必要がある（Next.js 14の要件）

import { Suspense } from 'react'
import ResultContent from './ResultContent'

// ローディング中のフォールバックUI
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      <p className="text-white/50 text-sm">診断結果を読み込み中...</p>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultContent />
    </Suspense>
  )
}
