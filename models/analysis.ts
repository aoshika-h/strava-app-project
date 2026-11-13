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
    ridesPerWeek: number        // 週あたりライド数
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
  personalityComment?: string | null  // Claude APIによる性格コメント（取得できなければnull）
}

// 値を0〜100の範囲に正規化するヘルパー
function normalize(value: number, min: number, max: number): number {
  return Math.min(100, Math.max(0, Math.round(((value - min) / (max - min)) * 100)))
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

  // 週あたりライド数
  const weeksInPeriod = periodDays / 7
  const ridesPerWeek = rides.length / weeksInPeriod

  // パワーデータ（パワーメーターがある場合のみ）
  const powerRides = rides.filter((r) => r.average_watts && r.average_watts > 50)
  const avgWatts =
    powerRides.length > 0
      ? powerRides.reduce((s, r) => s + (r.average_watts || 0), 0) / powerRides.length
      : 0

  // ---- レーダーチャート用スコア計算 ----
  // 各スコアは実測値を一般的な範囲で正規化（0〜100）

  const scores = {
    climbing: normalize(climbingRatio, 2, 30),    // 2〜30 m/km が目安
    speed: normalize(avgSpeed, 18, 42),            // 18〜42 km/h
    endurance: normalize(avgDistance, 20, 150),    // 20〜150 km
    power: avgWatts > 0 ? normalize(avgWatts, 100, 350) : normalize(avgSpeed, 20, 40), // パワーがなければ速度で代替
    consistency: normalize(ridesPerWeek, 0.5, 7), // 週0.5〜7回
  }

  // ---- キャラクタータイプの判定 ----
  // 各キャラクターへの適合スコアを指標ごとに積み上げ、最大値を選ぶ
  // 人為的な優先順位を排除し、データが判定を決める

  const charScores: Record<CharacterId, number> = {
    climber:    0,
    sprinter:   0,
    tt:         0,
    granfondo:  0,
    allrounder: 0,
    weekend:    0,
  }

  // 登坂比率 → クライマー・グランフォンドに加点
  const climbScore = normalize(climbingRatio, 2, 30)
  charScores.climber    += climbScore * 2.0  // 登坂はクライマーの主指標なので重み2倍
  charScores.granfondo  += climbScore * 0.5  // グランフォンドも山を走ることがある

  // 平均距離 → グランフォンド・TTに加点
  const distScore = normalize(avgDistance, 20, 150)
  charScores.granfondo  += distScore * 2.0   // 長距離はグランフォンドの主指標
  charScores.tt         += distScore * 0.8
  charScores.allrounder += distScore * 0.5

  // 平均速度 → スプリンター・TTに加点
  const speedScore = normalize(avgSpeed, 18, 42)
  charScores.sprinter   += speedScore * 1.5
  charScores.tt         += speedScore * 1.5  // TTは速度が主指標
  charScores.allrounder += speedScore * 0.5

  // 短距離補正: 距離が短いほどスプリンター寄り、長いほどTT・グランフォンド寄り
  const shortBias = normalize(60 - avgDistance, -90, 60) // 距離が短いと高スコア
  charScores.sprinter   += shortBias * 1.0

  // 頻度の低さ → サンデーライダーに加点（頻度が低いほど高スコア）
  const lowFreqScore = normalize(3 - ridesPerWeek, -4, 3)
  charScores.weekend    += lowFreqScore * 2.0

  // 頻度の高さ → オールラウンダー・TTに加点
  const freqScore = normalize(ridesPerWeek, 0.5, 7)
  charScores.allrounder += freqScore * 1.0
  charScores.tt         += freqScore * 0.5

  // パワー → TT・クライマーに加点（パワーメーターがある場合のみ）
  if (avgWatts > 0) {
    const powerScore = normalize(avgWatts, 100, 350)
    charScores.tt      += powerScore * 1.0
    charScores.climber += powerScore * 0.5
  }

  // 各キャラクターのスコアが最大のものを選択
  const characterId = (Object.entries(charScores) as [CharacterId, number][])
    .reduce((best, curr) => curr[1] > best[1] ? curr : best)[0]

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
      ridesPerWeek: Math.round(ridesPerWeek * 10) / 10,
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
      ridesPerWeek: 0,
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
