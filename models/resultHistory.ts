// 前回の診断結果（ブラウザのlocalStorageにのみ保存、サーバーには送らない）

import type { AnalysisResult } from './analysis'
import type { CharacterId } from './characters'

export interface StoredResult {
  characterId: CharacterId
  scores: AnalysisResult['scores']
  date: string // ISO文字列
}

const STORAGE_KEY = 'veloava_last_result'

export function loadLastResult(): StoredResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredResult) : null
  } catch {
    return null
  }
}

export function saveLastResult(result: AnalysisResult) {
  try {
    const data: StoredResult = {
      characterId: result.characterId,
      scores: result.scores,
      date: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ストレージ書き込み失敗は無視
  }
}
