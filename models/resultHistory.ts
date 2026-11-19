// 前回の診断結果（ブラウザのlocalStorageにのみ保存、サーバーには送らない）
// 期間が違う診断どうしを比べると数値が大きくぶれるため、分析期間ごとに直近1件を持つ

import type { AnalysisResult } from './analysis'
import type { CharacterId } from './characters'

export interface StoredResult {
  characterId: CharacterId
  scores: AnalysisResult['scores']
  periodDays: number
  date: string // ISO文字列
}

const STORAGE_KEY = 'veloava_last_results'
// 期間を記録していなかった旧形式。比較に使えないので読み捨てる
const LEGACY_KEY = 'veloava_last_result'

function loadAll(): Record<string, StoredResult> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, StoredResult>) : {}
  } catch {
    return {}
  }
}

export function loadLastResult(periodDays: number): StoredResult | null {
  return loadAll()[String(periodDays)] ?? null
}

export function saveLastResult(result: AnalysisResult) {
  try {
    const all = loadAll()
    all[String(result.stats.periodDays)] = {
      characterId: result.characterId,
      scores: result.scores,
      periodDays: result.stats.periodDays,
      date: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // ストレージ書き込み失敗は無視
  }
}
