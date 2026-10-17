// キャラクター判定ロジック
// Stravaのライドデータを分析してサイクリストタイプを判定する

import type { StravaActivity, StravaAthlete } from './strava'

// キャラクタータイプの定義
export type CharacterId = 'climber' | 'sprinter' | 'tt' | 'granfondo' | 'allrounder' | 'weekend'

// キャラクター型定義（必殺技・キャッチコピー付き）
export interface CharacterType {
  id: CharacterId
  name: string           // キャラクター名
  title: string          // 肩書き
  emoji: string
  catchphrase: string    // キャッチコピー（セリフ風）
  specialMove: string    // 必殺技名
  description: string
  lore: string           // キャラクター背景ストーリー
  strengths: string[]
  tips: string[]
  colorClass: string
  accentColor: string
  bgClass: string
}

// 6種類のキャラクター定義
export const CHARACTERS: Record<CharacterId, CharacterType> = {
  climber: {
    id: 'climber',
    name: 'アルピニスト・クロス',
    title: '峠の番人',
    emoji: '🏔️',
    catchphrase: '「坂道は、私の舞台だ」',
    specialMove: '⚔️ ヴァーティカル・ライジング',
    description:
      '急勾配になるほど目が輝く山岳の申し子。軽量な体と高いVO2maxを武器に、激坂で別次元の加速を見せる。ライバルが喘いでいる場所で、クロスは微笑みながら踏み込む。',
    lore: '幼少期から山を駆け回り、気づけば自転車で峠を制覇していた。「平地は退屈だ」が口癖。',
    strengths: ['ヒルクライム', 'パワーウェイトレシオ', '長時間有酸素', '激坂加速'],
    tips: [
      'インターバルトレーニングでFTPを上げ、W/kgをさらに高めましょう',
      'ゾーン5強度の短時間インターバルでVO2maxを鍛えましょう',
      '平地でのペーシングを覚えると、山岳レースでより有利になります',
    ],
    colorClass: 'from-emerald-600 to-teal-500',
    accentColor: '#10B981',
    bgClass: 'bg-emerald-900/30',
  },
  sprinter: {
    id: 'sprinter',
    name: 'フラッシュ・ライナー',
    title: '閃光の追跡者',
    emoji: '⚡',
    catchphrase: '「誰も、私の背中は見たことがない」',
    specialMove: '⚔️ ファイナル・バースト',
    description:
      '残り200mで本領発揮する瞬発力の化身。普段は集団の中に潜み、ゴール直前に爆発的な加速で全員を置き去りにする。その瞬間だけ、世界が別の速度で動いている。',
    lore: '短距離走の選手だったが自転車に転向。スプリントの瞬間だけは「無音になる」と語る。',
    strengths: ['ゴールスプリント', '最大瞬間出力', '平地の短距離勝負', '加速力'],
    tips: [
      '10〜30秒の全力スプリント練習で無酸素能力を高めましょう',
      'スプリント後の素早い心拍回復も重要なトレーニングです',
      '集団走行でのポジショニングを練習して最後の位置取りを磨きましょう',
    ],
    colorClass: 'from-amber-500 to-orange-500',
    accentColor: '#F59E0B',
    bgClass: 'bg-amber-900/30',
  },
  tt: {
    id: 'tt',
    name: 'アイアン・クロノス',
    title: '鋼鉄の巡航者',
    emoji: '⏱️',
    catchphrase: '「私のペースに、合わせてみろ」',
    specialMove: '⚔️ インフィニット・クルーズ',
    description:
      '高出力を何時間でも維持できる走るエンジン。無表情でペダルを踏み続ける姿はまさに機械。風雨も向かい風も関係なく、一定の速度で地面を削り続ける。',
    lore: '元エンジニア。「人間の体もチューニング次第で機械になれる」という信念でトレーニングする。',
    strengths: ['平地での高速巡航', '閾値出力の維持', 'ペースコントロール', '精神的強さ'],
    tips: [
      '20分FTPテストを定期的に行いベースラインを把握しましょう',
      'スウィートスポット（FTPの88〜93%）でのロングインターバルが効果的です',
      '有酸素ベース走行距離を増やして心臓を強化しましょう',
    ],
    colorClass: 'from-blue-600 to-cyan-500',
    accentColor: '#3B82F6',
    bgClass: 'bg-blue-900/30',
  },
  granfondo: {
    id: 'granfondo',
    name: 'グランデ・エクスプローラー',
    title: '大地の開拓者',
    emoji: '🌄',
    catchphrase: '「地平線の向こうに、まだ道がある」',
    specialMove: '⚔️ エンドレス・ロード',
    description:
      '100kmはウォームアップ——そう言って笑える規格外のスタミナを持つ大地の申し子。長ければ長いほど本領を発揮し、200km地点でも笑顔でペダルを踏み続ける伝説のライダー。',
    lore: '過去に日本縦断を達成。「まだ走れる気がする」が口癖で仲間をドン引きさせる。',
    strengths: ['超長距離ライド', '長時間持続力', 'エネルギー管理', '精神的タフネス'],
    tips: [
      'ライド中の補給タイミングと量を精密に計画しましょう',
      'ゾーン2の3〜5時間ロングライドで有酸素基礎を固めましょう',
      '睡眠・栄養・リカバリーを三位一体で管理することが最重要です',
    ],
    colorClass: 'from-purple-600 to-violet-500',
    accentColor: '#8B5CF6',
    bgClass: 'bg-purple-900/30',
  },
  allrounder: {
    id: 'allrounder',
    name: 'オムニ・ライダー',
    title: '万能の勇者',
    emoji: '🎯',
    catchphrase: '「どこでも戦える。それが私の強さだ」',
    specialMove: '⚔️ オムニ・フォース',
    description:
      '山でも平地でも、短距離でも長距離でも一定以上の走りを見せる万能型の勇者。明確な弱点がない代わりに、どんな状況でもチームの柱になれる。真の実力者だけが辿り着ける境地。',
    lore: '様々な競技を経験し自転車に落ち着いた。「専門性より適応力」を信条とする。',
    strengths: ['バランスの良さ', 'あらゆるコースへの適応力', 'チームの要', '安定したパフォーマンス'],
    tips: [
      '一番得意な分野を伸ばして、万能から「最強の万能」を目指しましょう',
      '週ごとに異なる地形・距離のライドを取り入れてバランスを維持しましょう',
      '目標レースを決めて、それに向けた特化トレーニングを組みましょう',
    ],
    colorClass: 'from-orange-500 to-red-500',
    accentColor: '#FC4C02',
    bgClass: 'bg-orange-900/30',
  },
  weekend: {
    id: 'weekend',
    name: 'フリーダム・サニー',
    title: '風まかせの自由人',
    emoji: '☀️',
    catchphrase: '「今日も風になる、それだけでいい」',
    specialMove: '⚔️ サンシャイン・ライド',
    description:
      'タイムより景色、KOMよりコーヒー——自転車を純粋に楽しむ心の豊かさを持つライダー。週末の解放感を最大限に味わい、走ること自体が目的の自由な魂。実はそれが一番幸せかもしれない。',
    lore: '仕事のストレスを走って発散するうちに自転車にハマった。ライド後のご飯が最大の楽しみ。',
    strengths: ['ライドを楽しむ心', 'メンタルヘルス維持', '継続する意志', '自由なスタイル'],
    tips: [
      '週2〜3回のライドをまず習慣化してみましょう',
      'グループライドに参加すると走る距離が自然と伸びます',
      '月に1回だけ少し頑張るライドを入れると成長を実感できます',
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
  sex: 'male' | 'female'
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
