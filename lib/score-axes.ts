// レーダーチャート・スコアバー・前回比較・一言コメントで共通に使う「5つの能力」の並び順
// 表示名は言語ごとの辞書（dict.axes）にある。呼び出し元: app/[lang]/result/_components の各部品と lib/insights.ts
import type { AnalysisResult } from './analysis'

export type ScoreKey = keyof AnalysisResult['scores']

export const SCORE_KEYS: ScoreKey[] = ['climbing', 'speed', 'endurance', 'power', 'consistency']
