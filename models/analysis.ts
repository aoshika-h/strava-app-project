// キャラクター判定ロジック
// Stravaのライドデータを分析してサイクリストタイプを判定する

import type { StravaActivity, StravaAthlete } from './strava'
import type { CharacterId, Sex } from './characters'

// 分析結果の型（URLパラメータとしてエンコードして渡す）
export interface AnalysisResult {
  characterId: CharacterId
  athleteName: string
  profileImageUrl: string
  sex: Sex
  stats: {
    totalRides: number          // 期間内のライド数
    avgDistanceKm: number       // 平均ライド距離 (km)
    totalDistanceKm: number     // 合計距離 (km)
    totalElevationM: number     // 合計獲得標高 (m)
    avgSpeedKmh: number         // 平均速度 (km/h)
    climbingRatioMPerKm: number // 獲得標高比率 (m/km)
    ridingDaysPerWeek: number   // 週あたりの乗った日数（1日に複数アクティビティがあっても1日）
    avgWatts: number            // 平均パワー (ワット、0=データなし)
    periodDays: number          // 分析期間 (日)
  }
  scores: {
    climbing: number     // 登坂力 0-100
    speed: number        // スピード 0-100
    endurance: number    // 持久力 0-100
    power: number        // 出力 0-100
    consistency: number  // 継続性 0-100
  }
}

// 値を0〜100の範囲に正規化するヘルパー
function normalize(value: number, min: number, max: number): number {
  return Math.min(100, Math.max(0, Math.round(((value - min) / (max - min)) * 100)))
}

// 各キャラへの適合度（0〜100）を求めて最大のキャラを選ぶ
// 入力の数でキャラ間に差が出ないよう、どのキャラも重みの合計を1にした加重平均で比べる
export function pickCharacter(scores: AnalysisResult['scores'], hasPower: boolean): CharacterId {
  const { climbing, speed, endurance, consistency } = scores
  const power = hasPower ? scores.power : speed
  const riding = [climbing, speed, endurance, consistency]
  const mean = riding.reduce((a, b) => a + b, 0) / riding.length
  const spread = Math.max(...riding) - Math.min(...riding)

  const affinity: Record<CharacterId, number> = {
    climber: 0.8 * climbing + 0.2 * power,
    granfondo: 0.75 * endurance + 0.25 * climbing,
    tt: 0.5 * speed + 0.2 * endurance + 0.3 * power,
    sprinter: 0.7 * speed + 0.3 * (100 - endurance) - 8,
    // 突出した能力がなく、どれもそこそこ以上
    allrounder: mean - 0.6 * spread + 25,
    // 乗る頻度が低くてもロング派はグランフォンドを優先したいので少し弱める
    weekend: 0.85 * (100 - consistency),
  }
  return (Object.entries(affinity) as [CharacterId, number][]).reduce((best, curr) => (curr[1] > best[1] ? curr : best))[0]
}

// メイン分析関数
// activities: 取得したStravaアクティビティ配列
// athlete: アスリートプロフィール
// periodDays: 分析期間（日数）
export function analyzeCharacter(
  activities: StravaActivity[],
  athlete: StravaAthlete,
  periodDays = 90
): AnalysisResult {
  // ライドのみにフィルタリング（ランやウォークは除外）
  const rides = activities.filter(
    (a) =>
      (a.type === 'Ride' || a.type === 'VirtualRide' || a.sport_type === 'Ride') &&
      a.distance > 500  // 500m未満は誤登録とみなして除外
  )

  // ライドがゼロの場合はサンデーライダーとして扱う
  if (rides.length === 0) {
    return buildResult('weekend', athlete, { totalRides: 0 }, periodDays)
  }

  // ---- 基本統計の計算 ----

  const totalDistM = rides.reduce((s, r) => s + r.distance, 0)
  const totalDistKm = totalDistM / 1000
  const totalElev = rides.reduce((s, r) => s + r.total_elevation_gain, 0)

  // 獲得標高比率: 山岳系かどうかの指標 (m/km)
  const climbingRatio = totalDistKm > 0 ? totalElev / totalDistKm : 0

  // 平均速度 (km/h)
  const speeds = rides.map((r) => r.average_speed * 3.6)
  const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length

  // 平均距離 (km)
  const avgDistance = totalDistKm / rides.length

  // 週あたりの乗った日数（屋内ライドやアクティビティ分割で件数が膨らむため、日付単位で数える）
  const ridingDays = new Set(rides.map((r) => r.start_date_local.slice(0, 10))).size
  const ridingDaysPerWeek = ridingDays / (periodDays / 7)

  // パワーデータ（パワーメーターがある場合のみ）
  const powerRides = rides.filter((r) => r.average_watts && r.average_watts > 50)
  const avgWatts =
    powerRides.length > 0
      ? powerRides.reduce((s, r) => s + (r.average_watts || 0), 0) / powerRides.length
      : 0

  // ---- レーダーチャート用スコア（0〜100）----
  // 範囲は一般的なロード乗りの分布に合わせる（端の値ほど個性が強い）
  const hasPower = avgWatts > 0
  const scores = {
    climbing: normalize(climbingRatio, 3, 18),         // 3〜18 m/km
    speed: normalize(avgSpeed, 20, 34),                // 20〜34 km/h
    endurance: normalize(avgDistance, 20, 120),        // 20〜120 km
    power: hasPower ? normalize(avgWatts, 120, 280) : normalize(avgSpeed, 20, 34), // パワーがなければ速度で代替
    consistency: normalize(ridingDaysPerWeek, 0.5, 6), // 週0.5〜6日
  }

  const characterId = pickCharacter(scores, hasPower)

  return buildResult(
    characterId,
    athlete,
    {
      totalRides: rides.length,
      avgDistanceKm: Math.round(avgDistance * 10) / 10,
      totalDistanceKm: Math.round(totalDistKm),
      totalElevationM: Math.round(totalElev),
      avgSpeedKmh: Math.round(avgSpeed * 10) / 10,
      climbingRatioMPerKm: Math.round(climbingRatio * 10) / 10,
      ridingDaysPerWeek: Math.round(ridingDaysPerWeek * 10) / 10,
      avgWatts: Math.round(avgWatts),
    },
    periodDays,
    scores
  )
}

// 分析結果オブジェクトを組み立てるヘルパー
function buildResult(
  characterId: CharacterId,
  athlete: StravaAthlete,
  partialStats: Partial<AnalysisResult['stats']>,
  periodDays: number,
  scores?: AnalysisResult['scores']
): AnalysisResult {
  return {
    characterId,
    athleteName: `${athlete.firstname} ${athlete.lastname}`.trim() || athlete.username || '名無しライダー',
    profileImageUrl: athlete.profile || '',
    sex: athlete.sex === 'F' ? 'female' : 'male',
    stats: {
      totalRides: 0,
      avgDistanceKm: 0,
      totalDistanceKm: 0,
      totalElevationM: 0,
      avgSpeedKmh: 0,
      climbingRatioMPerKm: 0,
      ridingDaysPerWeek: 0,
      avgWatts: 0,
      periodDays,
      ...partialStats,
    },
    scores: scores ?? {
      climbing: 20,
      speed: 20,
      endurance: 20,
      power: 20,
      consistency: 20,
    },
  }
}
