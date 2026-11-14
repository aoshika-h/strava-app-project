import type { AnalysisResult } from '@/models/analysis'

export const SCORE_AXES: { label: string; key: keyof AnalysisResult['scores'] }[] = [
  { label: '登坂力', key: 'climbing' },
  { label: 'スピード', key: 'speed' },
  { label: '持久力', key: 'endurance' },
  { label: '出力', key: 'power' },
  { label: '継続性', key: 'consistency' },
]
