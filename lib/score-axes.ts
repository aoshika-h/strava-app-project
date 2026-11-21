// レーダーチャート・スコアバー・前回比較・一言コメントで共通に使う「5つの能力」の表示名と並び順
// 呼び出し元: app/result/_components の各部品と lib/insights.ts。サーバーでもブラウザでも動く
import type { AnalysisResult } from './analysis'

// keyof AnalysisResult['scores'] は scores のキー名（'climbing' | 'speed' | ...）だけを許す型。打ち間違えると型エラーになる
export const SCORE_AXES: { label: string; key: keyof AnalysisResult['scores'] }[] = [
  { label: '登坂力', key: 'climbing' },
  { label: 'スピード', key: 'speed' },
  { label: '持久力', key: 'endurance' },
  { label: '出力', key: 'power' },
  { label: '継続性', key: 'consistency' },
]
