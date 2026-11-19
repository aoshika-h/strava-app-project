// 診断前にユーザーが選んだ「予想タイプ」（ユーザー自身の入力でStrava由来ではない）
// 結果ページで一度だけ答え合わせに使い、表示したら消す

import { isCharacterId, type CharacterId } from './characters'

export type PredictedType = CharacterId | 'unknown'

const STORAGE_KEY = 'veloava_prediction'

export function savePrediction(predicted: PredictedType) {
  try {
    localStorage.setItem(STORAGE_KEY, predicted)
  } catch {
    // 保存できなくても診断は続ける
  }
}

// 読み出したら消す（古い予想が別の診断結果に出ないように）
export function takePrediction(): CharacterId | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_KEY)
    return isCharacterId(value) ? value : null
  } catch {
    return null
  }
}
