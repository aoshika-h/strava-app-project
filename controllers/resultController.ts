// 診断結果のURLパラメータとの相互変換と、結果ページに渡すデータの組み立て
// サーバーレスでセッションを持たないため、結果はJSON→Base64urlでURLに載せる

import type { AnalysisResult } from '@/models/analysis'
import { isCharacterId, type CharacterId, type Sex } from '@/models/characters'

export type ResultPageData =
  | { status: 'ok'; result: AnalysisResult; isPreview: boolean }
  | { status: 'missing' }
  | { status: 'invalid' }

export function encodeResult(result: AnalysisResult): string {
  return Buffer.from(JSON.stringify(result), 'utf8').toString('base64url')
}

export function decodeResult(encoded: string): AnalysisResult | null {
  try {
    const result = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as AnalysisResult
    return isCharacterId(result?.characterId) ? result : null
  } catch {
    return null
  }
}

// ?preview=climber&sex=female でモックデータを表示する（?data= より優先）
export function getResultPageData(params: { data?: string; preview?: string; sex?: string }): ResultPageData {
  if (isCharacterId(params.preview)) {
    const sex: Sex = params.sex === 'female' ? 'female' : 'male'
    return { status: 'ok', result: buildPreviewResult(params.preview, sex), isPreview: true }
  }
  if (!params.data) return { status: 'missing' }
  const result = decodeResult(params.data)
  return result ? { status: 'ok', result, isPreview: false } : { status: 'invalid' }
}

function buildPreviewResult(characterId: CharacterId, sex: Sex): AnalysisResult {
  return {
    characterId,
    athleteName: 'テストライダー',
    profileImageUrl: '',
    sex,
    stats: {
      totalRides: 42,
      avgDistanceKm: 65.0,
      totalDistanceKm: 2730,
      totalElevationM: 18500,
      avgSpeedKmh: 28.5,
      climbingRatioMPerKm: 6.8,
      ridesPerWeek: 3.5,
      avgWatts: 210,
      periodDays: 90,
    },
    scores: { climbing: 75, speed: 68, endurance: 80, power: 65, consistency: 72 },
  }
}
