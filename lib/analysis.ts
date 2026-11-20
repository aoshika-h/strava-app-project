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
    outdoorRides?: number       // 速度・平均距離・登坂の計算に使った屋外ライド数（0なら屋内も含めて計算）
    indoorRides?: number        // Zwift・ローラーなど屋内ライドの本数
    peakRatio?: number          // 最大パワー÷平均パワーの中央値（大きいほど低強度にスプリントを混ぜる走り）。実測パワーがなければ 0
    variabilityIndex?: number   // NP÷平均パワーの中央値（1に近いほど一定ペース）。実測パワーがなければ 0
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

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// パワーの使い方の特徴（0〜100）。実測パワーのライドが少ないときは null
export interface PowerProfile {
  punch: number      // スプリント傾向: 最大÷平均が大きいほど高い
  steadiness: number // 一定ペース傾向: NP÷平均が1に近いほど高い
}

// 各キャラへの適合度（0〜100）を求めて最大のキャラを選ぶ
// 入力の数でキャラ間に差が出ないよう、どのキャラも重みの合計を1にした加重平均で比べる
export function pickCharacter(scores: AnalysisResult['scores'], hasPower: boolean, profile: PowerProfile | null = null): CharacterId {
  const { climbing, speed, endurance, consistency } = scores
  const power = hasPower ? scores.power : speed
  const riding = [climbing, speed, endurance, consistency]
  const mean = riding.reduce((a, b) => a + b, 0) / riding.length
  const spread = Math.max(...riding) - Math.min(...riding)

  const affinity: Record<CharacterId, number> = {
    climber: 0.8 * climbing + 0.2 * power,
    granfondo: 0.75 * endurance + 0.25 * climbing,
    // パワーの使い方が分かる人は、一定ペース（TT）かスプリント混じり（スプリンター）かも判定に入れる
    tt: profile
      ? 0.4 * speed + 0.2 * endurance + 0.25 * power + 0.15 * profile.steadiness
      : 0.5 * speed + 0.2 * endurance + 0.3 * power,
    sprinter: profile
      ? 0.4 * speed + 0.2 * (100 - endurance) + 0.4 * profile.punch - 8
      : 0.7 * speed + 0.3 * (100 - endurance) - 8,
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
  const isIndoor = (a: StravaActivity) => a.type === 'VirtualRide' || a.sport_type === 'VirtualRide' || a.trainer === true
  const rides = activities.filter(
    (a) =>
      (a.type === 'Ride' || a.type === 'VirtualRide' || a.sport_type === 'Ride' || a.sport_type === 'VirtualRide') &&
      // 500m未満は誤登録とみなして除外。ただし ERG のローラー練習は距離 0 で記録されるアプリがあるので、10分以上動いていれば数える
      (a.distance > 500 || (isIndoor(a) && a.moving_time >= 600))
  )

  // ライドがゼロの場合はサンデーライダーとして扱う
  if (rides.length === 0) {
    return buildResult('weekend', athlete, { totalRides: 0 }, periodDays)
  }

  // ---- 基本統計の計算 ----

  // 合計は屋内も含めた練習量として全ライドで出す
  const totalDistKm = rides.reduce((s, r) => s + r.distance, 0) / 1000
  const totalElev = rides.reduce((s, r) => s + r.total_elevation_gain, 0)

  // 走りの特徴（速度・1回の距離・登坂）は実走を基準にする。Zwiftなどの屋内ライドは速度が出やすく
  // 短い練習が多いため、混ぜるとスプリンター寄りに歪む。屋外が1件もない人だけ屋内も含める
  const outdoor = rides.filter((r) => !isIndoor(r))
  const basis = outdoor.length > 0 ? outdoor : rides
  // 距離・速度・登坂は距離が記録されたライドだけで計算する（距離 0 のローラー練習で平均が下がらないように）
  const withDistance = basis.filter((r) => r.distance > 500)
  const basisDistKm = withDistance.reduce((s, r) => s + r.distance, 0) / 1000
  const basisElev = withDistance.reduce((s, r) => s + r.total_elevation_gain, 0)

  // 獲得標高比率: 山岳系かどうかの指標 (m/km)
  const climbingRatio = basisDistKm > 0 ? basisElev / basisDistKm : 0

  // 平均速度 (km/h)
  const avgSpeed = withDistance.length > 0 ? withDistance.reduce((s, r) => s + r.average_speed * 3.6, 0) / withDistance.length : 0

  // 平均距離 (km)
  const avgDistance = withDistance.length > 0 ? basisDistKm / withDistance.length : 0
  // 1回あたりの時間（屋外ライドがない人の持久力は距離ではなく時間で測る）
  const avgHours = basis.reduce((s, r) => s + (r.moving_time ?? 0), 0) / basis.length / 3600

  // 週あたりの乗った日数（屋内ライドやアクティビティ分割で件数が膨らむため、日付単位で数える）
  const ridingDays = new Set(rides.map((r) => r.start_date_local.slice(0, 10))).size
  const ridingDaysPerWeek = ridingDays / (periodDays / 7)

  // パワーデータ（実測のみ。Strava はパワーメーターがなくても推定値を返すので device_watts で除外する）
  const powerRides = rides.filter((r) => r.device_watts === true && (r.average_watts ?? 0) > 50)
  const avgWatts =
    powerRides.length > 0
      ? powerRides.reduce((s, r) => s + (r.average_watts || 0), 0) / powerRides.length
      : 0

  // パワーの使い方（要約データから推定。秒ごとのデータは取得しない）
  const peakRatio = median(powerRides.filter((r) => (r.max_watts ?? 0) > 0).map((r) => r.max_watts! / r.average_watts!))
  const variabilityIndex = median(
    powerRides.filter((r) => (r.weighted_average_watts ?? 0) > 0).map((r) => r.weighted_average_watts! / r.average_watts!),
  )
  // 3本以上の実測ライドがあるときだけ判定に使う
  const profile: PowerProfile | null =
    powerRides.length >= 3 && peakRatio > 0 && variabilityIndex > 0
      ? {
          punch: normalize(peakRatio, 3, 7),                       // 最大÷平均 3倍〜7倍
          steadiness: 100 - normalize(variabilityIndex, 1.03, 1.2), // NP÷平均 1.03〜1.2
        }
      : null

  // ---- レーダーチャート用スコア（0〜100）----
  // 範囲は一般的なロード乗りの分布に合わせる（端の値ほど個性が強い）
  const hasPower = avgWatts > 0
  const speedScore = normalize(avgSpeed, 20, 34)       // 20〜34 km/h
  const powerScore = hasPower ? normalize(avgWatts, 120, 280) : speedScore // パワーがなければ速度で代替
  const scores = {
    climbing: normalize(climbingRatio, 3, 18),         // 3〜18 m/km
    // 屋外ライドがない人の速度は Zwift の値で実力より出やすいので、パワーがあればパワーで代える
    speed: outdoor.length === 0 && hasPower ? powerScore : speedScore,
    // 屋外は 1回の距離 20〜120 km、屋外ライドがない人は 1回の時間 45分〜4時間（ローラーは距離が出ないことがあるため）
    endurance: outdoor.length > 0 ? normalize(avgDistance, 20, 120) : normalize(avgHours, 0.75, 4),
    power: powerScore,
    consistency: normalize(ridingDaysPerWeek, 0.5, 6), // 週0.5〜6日
  }

  const characterId = pickCharacter(scores, hasPower, profile)

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
      outdoorRides: outdoor.length,
      indoorRides: rides.length - outdoor.length,
      peakRatio: Math.round(peakRatio * 10) / 10,
      variabilityIndex: Math.round(variabilityIndex * 100) / 100,
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
