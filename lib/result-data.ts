// 診断結果のURLパラメータとの相互変換と、結果ページに渡すデータの組み立て
// サーバーレスでセッションを持たないため、結果はJSON→Base64urlでURLに載せる
// 呼び出し元: app/api/auth/callback/route.ts（encodeResult）と app/[lang]/result/page.tsx（getResultPageData）。Buffer を使うのでサーバーでだけ動く

import type { AnalysisResult } from '@/lib/analysis'
import { isCharacterId, type CharacterId, type Sex } from '@/lib/characters'
import { buildInsights } from '@/lib/insights'
import type { Locale } from '@/lib/i18n/config'

// 結果ページに渡すデータの型。status の値によって中身が変わる（判別可能なユニオン型）
// status === 'ok' を確かめると、TypeScript が result や insights があると分かってくれる
export type ResultPageData =
  | { status: 'ok'; result: AnalysisResult; insights: string[]; isPreview: boolean }
  | { status: 'missing' }
  | { status: 'invalid' }

// Buffer は Node.js のバイナリ操作。JSON 文字列を UTF-8 のバイト列にしてから base64url（URL に載せても壊れない Base64）にする
// ブラウザの btoa/atob は日本語を正しく扱えないので使わない
export function encodeResult(result: AnalysisResult): string {
  return Buffer.from(JSON.stringify(result), 'utf8').toString('base64url')
}

export function decodeResult(encoded: string): AnalysisResult | null {
  try {
    // 廃止したAIコメント（personalityComment）を含む旧URLもあるため、既知のフィールドだけを取り出す
    // 分割代入で必要な項目だけ取り出す。`as AnalysisResult` は「この形のはず」と TypeScript に伝えるだけで、中身の検査はしない
    // URL は書き換えられるので、壊れたデータなら JSON.parse が例外を投げ、catch で null を返す
    const { characterId, athleteName, profileImageUrl, sex, stats, scores } = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as AnalysisResult
    if (!isCharacterId(characterId)) return null
    // 旧URLは週あたり「ライド件数」(ridesPerWeek) を持つ。件数で近似して表示を崩さない
    // `&` は型の合成（交差型）。今の stats の型に、昔あった ridesPerWeek も持っているかもしれない、という型を足している
    const legacy = stats as AnalysisResult['stats'] & { ridesPerWeek?: number }
    const ridingDaysPerWeek = legacy.ridingDaysPerWeek ?? legacy.ridesPerWeek ?? 0
    // `{ ...stats, ridingDaysPerWeek }` はスプレッド構文。stats をコピーして ridingDaysPerWeek だけ上書きした新しいオブジェクトを作る
    return { characterId, athleteName, profileImageUrl, sex, stats: { ...stats, ridingDaysPerWeek }, scores }
  } catch {
    return null
  }
}

// ?preview=climber&sex=female でモックデータを表示する（?data= より優先）
// 引数の `data?: string` の ? は「無いこともある」。URL のクエリはどれも省略されうる
// locale は一言コメントの言語（診断結果そのものは言語に関係なく同じ）
export function getResultPageData(params: { data?: string; preview?: string; sex?: string }, locale: Locale): ResultPageData {
  if (isCharacterId(params.preview)) {
    const sex: Sex = params.sex === 'female' ? 'female' : 'male'
    const result = buildPreviewResult(params.preview, sex)
    return { status: 'ok', result, insights: buildInsights(result, locale), isPreview: true }
  }
  if (!params.data) return { status: 'missing' }
  const result = decodeResult(params.data)
  return result ? { status: 'ok', result, insights: buildInsights(result, locale), isPreview: false } : { status: 'invalid' }
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
