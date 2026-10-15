// キャラクター判定ロジック
// Stravaのライドデータを分析してサイクリストタイプを判定する

import type { StravaActivity, StravaAthlete } from './strava'

// キャラクタータイプの定義
export type CharacterId = 'climber' | 'sprinter' | 'tt' | 'granfondo' | 'allrounder' | 'weekend'

export interface CharacterType {
  id: CharacterId
  name: string
  emoji: string
  subtitle: string
  description: string
  strengths: string[]
  tips: string[]
  colorClass: string        // Tailwindグラデーションクラス
  accentColor: string       // SVGチャート用HEXカラー
  bgClass: string           // カード背景色クラス
}

// 6種類のキャラクター定義
export const CHARACTERS: Record<CharacterId, CharacterType> = {
  climber: {
    id: 'climber',
    name: 'クライマー',
    emoji: '🏔️',
    subtitle: '山岳の覇者',
    description:
      '急勾配も軽々と登りこなす山岳スペシャリスト。高い有酸素能力と優れたパワーウェイトレシオを武器に、どんな激坂も制覇します。登りで仲間を置き去りにするのが得意技。',
    strengths: ['ヒルクライム', '長時間の有酸素運動', '標高差の多いコース', 'パワーウェイトレシオ'],
    tips: [
      '体重管理を続けてW/kgをさらに向上させましょう',
      'L4〜L5インターバルでVO2maxを高めましょう',
      '平地でのペースを鍛えてオールラウンド性も向上させましょう',
    ],
    colorClass: 'from-emerald-600 to-teal-500',
    accentColor: '#10B981',
    bgClass: 'bg-emerald-900/30',
  },
  sprinter: {
    id: 'sprinter',
    name: 'スプリンター',
    emoji: '⚡',
    subtitle: '瞬速の稲妻',
    description:
      '爆発的な瞬発力を持つスプリントの天才。ゴール前の数百メートルで凄まじい加速を見せ、ライバルを圧倒します。短時間に最大出力を叩き出せる筋力が自慢。',
    strengths: ['ゴールスプリント', '最大瞬間出力', '平地の短距離勝負', '下り加速'],
    tips: [
      '30秒〜1分のショートインターバルで無酸素能力を高めましょう',
      'スプリント後の素早い回復トレーニングも取り入れましょう',
      '長距離での脚力消耗を抑えるペーシングを覚えましょう',
    ],
    colorClass: 'from-amber-500 to-orange-500',
    accentColor: '#F59E0B',
    bgClass: 'bg-amber-900/30',
  },
  tt: {
    id: 'tt',
    name: 'タイムトライアリスト',
    emoji: '⏱️',
    subtitle: '鉄の持続力',
    description:
      '高い持続出力を維持し続ける走りのエンジン。平地での巡航速度が圧倒的で、一定ペースを刻み続ける精神力と体力を兼ね備えています。ロングライドでも衰えない安定感が武器。',
    strengths: ['平地での高速巡航', '持続的な高出力', 'ペースコントロール', 'ロングライドの安定性'],
    tips: [
      'FTPトレーニングで閾値パワーを引き上げましょう',
      '20分〜1時間のステディステートトレーニングが効果的です',
      '有酸素ベースの走行距離を増やして基礎体力を養いましょう',
    ],
    colorClass: 'from-blue-600 to-cyan-500',
    accentColor: '#3B82F6',
    bgClass: 'bg-blue-900/30',
  },
  granfondo: {
    id: 'granfondo',
    name: 'グランフォンドライダー',
    emoji: '🌄',
    subtitle: '地平線の果てまで',
    description:
      '超長距離を走り抜く鉄人ライダー。100km以上のロングライドを軽々こなし、何時間でも走り続けられるスタミナの塊。レースより風景を楽しみながら限界に挑戦するスタイルが特徴。',
    strengths: ['超長距離ライド', '長時間持続力', 'エネルギー管理', '精神的タフネス'],
    tips: [
      'ライド中の補給計画を精密に組みましょう',
      'ゾーン2の長時間走で有酸素基礎を固めましょう',
      'リカバリーを大切にして怪我なく走り続けましょう',
    ],
    colorClass: 'from-purple-600 to-violet-500',
    accentColor: '#8B5CF6',
    bgClass: 'bg-purple-900/30',
  },
  allrounder: {
    id: 'allrounder',
    name: 'オールラウンダー',
    emoji: '🎯',
    subtitle: '万能の勇者',
    description:
      '登りも平地も、短距離も長距離もこなせるバランス型ライダー。特定の弱点がなく、どんなコースでも安定した走りを見せます。チームライドでも欠かせない頼れる存在。',
    strengths: ['バランスの良さ', 'あらゆるコースへの適応力', 'チームへの貢献', '安定したパフォーマンス'],
    tips: [
      '得意な分野をさらに伸ばして特化型を目指しましょう',
      'レースの目標設定で弱点を重点的に鍛えましょう',
      '多様なトレーニングで現状の高さを維持しましょう',
    ],
    colorClass: 'from-orange-500 to-red-500',
    accentColor: '#FC4C02',
    bgClass: 'bg-orange-900/30',
  },
  weekend: {
    id: 'weekend',
    name: 'サンデーライダー',
    emoji: '☀️',
    subtitle: '週末の自由人',
    description:
      '週末のライドを心から楽しむフリーダムライダー。タイムより景色、スピードより会話を大切にするスタイル。自転車との付き合い方は人それぞれ——マイペースが最高のペース。',
    strengths: ['ライドの楽しさ重視', 'リフレッシュ効果', 'サイクリングを継続する姿勢', '無理しない賢さ'],
    tips: [
      'まずは週2〜3回の定期ライドを習慣化してみましょう',
      'グループライドに参加してモチベーションを上げましょう',
      '短距離でいいので質の高いトレーニングを1回取り入れましょう',
    ],
    colorClass: 'from-pink-500 to-rose-500',
    accentColor: '#EC4899',
    bgClass: 'bg-pink-900/30',
  },
}

// 分析結果の型（URLパラメータとしてエンコードして渡す）
export interface AnalysisResult {
  characterId: CharacterId
  athleteName: string
  profileImageUrl: string
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
  // 優先順位付きのルールベースで判定
  let characterId: CharacterId

  if (climbingRatio >= 15) {
    // 獲得標高が15m/km以上 → 確実に山岳系
    characterId = 'climber'
  } else if (avgDistance >= 100) {
    // 平均100km以上のライド → グランフォンド
    characterId = 'granfondo'
  } else if (avgSpeed >= 33 && avgDistance < 60) {
    // 高速かつ短距離 → スプリンター
    characterId = 'sprinter'
  } else if (avgSpeed >= 28 && avgDistance >= 40) {
    // 平地高速巡航 → タイムトライアリスト
    characterId = 'tt'
  } else if (ridesPerWeek < 1.5 && avgDistance < 50) {
    // 頻度が低くて短い → サンデーライダー
    characterId = 'weekend'
  } else {
    // それ以外 → オールラウンダー
    characterId = 'allrounder'
  }

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
