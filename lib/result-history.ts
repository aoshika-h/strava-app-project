// 前回の診断結果（ブラウザのlocalStorageにのみ保存、サーバーには送らない）
// 期間が違う診断どうしを比べると数値が大きくぶれるため、分析期間ごとに直近1件を持つ
// 呼び出し元: app/result/_components/ResultView.tsx と app/_components/LatestUpdate.tsx の useEffect の中。ブラウザでだけ動く
// 保存形式: { "90": {...}, "180": {...}, "365": {...} } のように期間をキーにした1つの JSON

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

// localStorage は文字列しか保存できないので JSON.stringify / JSON.parse で変換する
// プライベートモードや壊れたデータで例外が出ることがあるので、try/catch で空として扱う
function loadAll(): Record<string, StoredResult> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, StoredResult>) : {}
  } catch {
    return {}
  }
}

// 以前に診断したことがあるか（期間を問わず保存済みの結果が1件でもあるか）
export function hasDiagnosedBefore(): boolean {
  try {
    return Object.keys(loadAll()).length > 0 || localStorage.getItem(LEGACY_KEY) !== null
  } catch {
    return false
  }
}

export function loadLastResult(periodDays: number): StoredResult | null {
  // 保存がなければ undefined になるので、`??` で null にそろえる
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
