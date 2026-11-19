// 診断結果のURLパラメータとの相互変換と、結果ページに渡すデータの組み立て
// サーバーレスでセッションを持たないため、結果はJSON→Base64urlでURLに載せる

import type { AnalysisResult } from '@/models/analysis'
import { isCharacterId, type CharacterId, type Sex } from '@/models/characters'
import { buildInsights } from '@/models/insights'

export type ResultPageData =
  | { status: 'ok'; result: AnalysisResult; insights: string[]; isPreview: boolean }
  | { status: 'missing' }
  | { status: 'invalid' }

export function encodeResult(result: AnalysisResult): string {
  return Buffer.from(JSON.stringify(result), 'utf8').toString('base64url')
}

export function decodeResult(encoded: string): AnalysisResult | null {
  try {
    // 廃止したAIコメント（personalityComment）を含む旧URLもあるため、既知のフィールドだけを取り出す
    const { characterId, athleteName, profileImageUrl, sex, stats, scores } = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as AnalysisResult
    if (!isCharacterId(characterId)) return null
    // 旧URLは週あたり「ライド件数」(ridesPerWeek) を持つ。件数で近似して表示を崩さない
    const legacy = stats as AnalysisResult['stats'] & { ridesPerWeek?: number }
    const ridingDaysPerWeek = legacy.ridingDaysPerWeek ?? legacy.ridesPerWeek ?? 0
    return { characterId, athleteName, profileImageUrl, sex, stats: { ...stats, ridingDaysPerWeek }, scores }
  } catch {
    return null
  }
}

// ?preview=climber&sex=female でモックデータを表示する（?data= より優先）
export function getResultPageData(params: { data?: string; preview?: string; sex?: string }): ResultPageData {
  if (isCharacterId(params.preview)) {
    const sex: Sex = params.sex === 'female' ? 'female' : 'male'
    const result = buildPreviewResult(params.preview, sex)
    return { status: 'ok', result, insights: buildInsights(result), isPreview: true }
  }
  if (!params.data) return { status: 'missing' }
  const result = decodeResult(params.data)
  return result ? { status: 'ok', result, insights: buildInsights(result), isPreview: false } : { status: 'invalid' }
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
      ridingDaysPerWeek: 3.5,
      avgWatts: 210,
      periodDays: 90,
    },
    scores: { climbing: 75, speed: 68, endurance: 80, power: 65, consistency: 72 },
  }
}
