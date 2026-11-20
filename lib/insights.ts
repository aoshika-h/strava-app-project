// ライドの数値からルールで組み立てる一言コメント
// AIは使わない（Strava API Policy 5.3）。結果ページの本人にだけ表示し、シェアカードには載せない

import type { AnalysisResult } from './analysis'
import { SCORE_AXES } from './score-axes'
import type { StoredResult } from './result-history'

type Stats = AnalysisResult['stats']
type Scores = AnalysisResult['scores']

// weight が大きいほど「その人らしい」コメント。同じ category からは1つだけ選ぶ
interface Insight {
  category: string
  weight: number
  text: string
}

const FUJI_M = 3776
const EVEREST_M = 8849
const SKYTREE_M = 634
const TOKYO_OSAKA_KM = 500
const JAPAN_LENGTH_KM = 3000

const fmt = (n: number, digits = 0) => n.toLocaleString('ja-JP', { maximumFractionDigits: digits })

const RULES: ((s: Stats, sc: Scores) => Insight | null)[] = [
  // 獲得標高を身近な山・建物に換算
  (s) => {
    const m = s.totalElevationM
    if (m >= EVEREST_M * 3) return { category: 'elevation', weight: 95, text: `この期間で登った高さはエベレスト${fmt(m / EVEREST_M, 1)}回分（${fmt(m)}m）。もはや登山家` }
    if (m >= FUJI_M) return { category: 'elevation', weight: 60 + Math.min(30, m / FUJI_M), text: `この期間で富士山${fmt(m / FUJI_M, 1)}個分（${fmt(m)}m）を自力で登った` }
    if (m >= SKYTREE_M) return { category: 'elevation', weight: 35, text: `獲得標高はスカイツリー${fmt(m / SKYTREE_M, 1)}本分（${fmt(m)}m）` }
    return null
  },
  // 総距離を日本の距離感に換算
  (s) => {
    const km = s.totalDistanceKm
    if (km >= JAPAN_LENGTH_KM) return { category: 'distance', weight: 85, text: `合計${fmt(km)}km。日本列島を${fmt(km / JAPAN_LENGTH_KM, 1)}回縦断できる距離` }
    if (km >= TOKYO_OSAKA_KM * 2) return { category: 'distance', weight: 65, text: `合計${fmt(km)}km。東京〜大阪を${fmt(km / (TOKYO_OSAKA_KM * 2), 1)}往復した計算` }
    if (km >= 100) return { category: 'distance', weight: 30, text: `合計${fmt(km)}km。ここから距離は積み上がっていく` }
    return null
  },
  // 頻度
  (s) => {
    const w = s.ridingDaysPerWeek
    if (w >= 5) return { category: 'frequency', weight: 90, text: `週${fmt(w, 1)}日。ほぼ毎日乗っている、継続の鬼` }
    if (w >= 3) return { category: 'frequency', weight: 55, text: `週${fmt(w, 1)}日。乗ることがしっかり習慣になっている` }
    if (w > 0 && w < 1) return { category: 'frequency', weight: 50, text: `週${fmt(w, 1)}日。乗りたい日に乗る、マイペースな楽しみ方` }
    return null
  },
  // 1回あたりの距離
  (s) => {
    const d = s.avgDistanceKm
    if (d >= 100) return { category: 'avg_distance', weight: 85, text: `1回平均${fmt(d, 1)}km。毎回がロングライド級` }
    if (d >= 60) return { category: 'avg_distance', weight: 45, text: `1回平均${fmt(d, 1)}km。しっかり距離を乗るタイプ` }
    if (d > 0 && d < 25) return { category: 'avg_distance', weight: 40, text: `1回平均${fmt(d, 1)}km。短く濃く、サクッと乗るスタイル` }
    return null
  },
  // 平均速度（屋外ライドがない人は Zwift の速度なので出さない）
  (s) => {
    if (s.outdoorRides === 0) return null
    const v = s.avgSpeedKmh
    if (v >= 32) return { category: 'speed', weight: 85, text: `平均${fmt(v, 1)}km/h。集団の先頭を引ける速さ` }
    if (v >= 28) return { category: 'speed', weight: 55, text: `平均${fmt(v, 1)}km/h。巡航力はかなり高い` }
    return null
  },
  // 登坂比率
  (s) => {
    const r = s.climbingRatioMPerKm
    if (r >= 15) return { category: 'terrain', weight: 80, text: `1kmあたり${fmt(r, 1)}m登っている。坂を探して走っているはず` }
    if (r >= 10) return { category: 'terrain', weight: 45, text: `1kmあたり${fmt(r, 1)}m。坂を避けずに走っている` }
    if (r > 0 && r <= 4) return { category: 'terrain', weight: 40, text: `1kmあたり${fmt(r, 1)}m。平坦路で気持ちよく巡航するのが好き` }
    return null
  },
  // パワー
  (s) => {
    const w = s.avgWatts
    if (w >= 220) return { category: 'power', weight: 80, text: `平均${fmt(w)}W。踏める脚を持っている` }
    if (w >= 160) return { category: 'power', weight: 40, text: `平均${fmt(w)}W。パワーで走りを管理できている` }
    if (w === 0) return { category: 'power', weight: 10, text: 'パワーメーターを付けると、診断の「出力」がもっと正確になる' }
    return null
  },
  // ローラー中心の人（週の本数で数える。1日に複数回乗る人もいるため日数ではない）
  (s) => {
    const indoor = s.indoorRides ?? 0
    if (indoor === 0 || s.totalRides === 0) return null
    const perWeek = indoor / (s.periodDays / 7)
    const share = Math.round((indoor / s.totalRides) * 100)
    if (perWeek >= 7 && (s.outdoorRides ?? 0) > 0) {
      return { category: 'indoor', weight: 92, text: `ローラー週${fmt(perWeek, 1)}本、外はたまに。部屋で鍛え上げた脚を、晴れた日に解き放つタイプ` }
    }
    if (perWeek >= 7) {
      return { category: 'indoor', weight: 92, text: `ローラー週${fmt(perWeek, 1)}本。天気も信号も関係なく、部屋で黙々と積み上げる求道者` }
    }
    if (share >= 70) {
      return { category: 'indoor', weight: 60, text: `ライドの${share}%がローラー。室内トレが主戦場` }
    }
    return null
  },
  // パワーの使い方（実測パワーがある人だけ）
  (s) => {
    const peak = s.peakRatio ?? 0
    const vi = s.variabilityIndex ?? 0
    if (peak >= 6) return { category: 'power_style', weight: 75, text: `最大パワーは平均の${fmt(peak, 1)}倍。ゆったり走りつつ、ここぞで一気にもがくタイプ` }
    if (vi > 0 && vi <= 1.05) return { category: 'power_style', weight: 70, text: `NP÷平均パワーが${fmt(vi, 2)}。パワーのブレが小さく、一定ペースで踏み続けられる` }
    if (vi >= 1.15) return { category: 'power_style', weight: 55, text: `NP÷平均パワーが${fmt(vi, 2)}。強弱をつけたメリハリのある走り（インターバル多め）` }
    return null
  },
  // ライド回数
  (s) => {
    if (s.totalRides >= 100) return { category: 'rides', weight: 70, text: `${s.periodDays}日で${s.totalRides}回のライド。積み上げた回数が強さになる` }
    if (s.totalRides === 0) return { category: 'rides', weight: 90, text: 'この期間のライドはまだなし。次の1本から物語が始まる' }
    return null
  },
  // 一番高い能力
  (_, sc) => {
    const top = [...SCORE_AXES].sort((a, b) => sc[b.key] - sc[a.key])[0]
    if (sc[top.key] < 50) return null
    return { category: 'strength', weight: 30 + sc[top.key] / 4, text: `いちばんの武器は${top.label}（${sc[top.key]}）` }
  },
  // 伸びしろ
  (_, sc) => {
    const low = [...SCORE_AXES].sort((a, b) => sc[a.key] - sc[b.key])[0]
    return { category: 'growth', weight: 20, text: `伸びしろは${low.label}（${sc[low.key]}）。ここが伸びると別のキャラも見えてくる` }
  },
]

export function buildInsights(result: AnalysisResult, max = 3): string[] {
  const candidates = RULES.map((rule) => rule(result.stats, result.scores)).filter((i): i is Insight => i !== null)
  const seen = new Set<string>()
  return candidates
    .sort((a, b) => b.weight - a.weight)
    .filter((i) => (seen.has(i.category) ? false : (seen.add(i.category), true)))
    .slice(0, max)
    .map((i) => i.text)
}

// 前回診断との比較コメント（ブラウザに保存した前回のキャラ・スコアだけを使う）
export function buildChangeInsights(prev: StoredResult, current: AnalysisResult, now = new Date()): string[] {
  const lines: string[] = []
  const days = Math.max(0, Math.round((now.getTime() - new Date(prev.date).getTime()) / 86_400_000))
  const diffs = SCORE_AXES.map((a) => ({ label: a.label, diff: current.scores[a.key] - prev.scores[a.key] }))
  const up = [...diffs].sort((a, b) => b.diff - a.diff)[0]
  const down = [...diffs].sort((a, b) => a.diff - b.diff)[0]

  if (up.diff >= 5) {
    lines.push(`${days > 0 ? `${days}日前` : '前回'}から${up.label}が+${up.diff}。走り込みの成果が出ている`)
  } else if (diffs.every((d) => Math.abs(d.diff) < 5)) {
    lines.push('前回からほぼ横ばい。安定して走れている証拠')
  }
  if (down.diff <= -10) {
    lines.push(`${down.label}は${down.diff}。最近のライドの傾向が変わったのかも`)
  }
  return lines
}
