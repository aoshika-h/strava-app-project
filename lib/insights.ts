// ライドの数値からルールで組み立てる一言コメント
// AIは使わない（Strava API Policy 5.3）。結果ページの本人にだけ表示し、シェアカードには載せない
// 呼び出し元: lib/result-data.ts（buildInsights、サーバー）と app/[lang]/result/_components/EvolutionCard.tsx（buildChangeInsights、ブラウザ）
// 仕組み: RULES の各関数がコメント候補を1つ返す → 重みの高い順に並べる → 同じ種類は1つだけにして上位3つを出す
// 多言語: 判定（しきい値・重み）はここで全言語共通。文章と例えの山・区間は lib/insights-messages/{ja,en,pt}.ts

import type { AnalysisResult } from './analysis'
import { SCORE_KEYS } from './score-axes'
import type { StoredResult } from './result-history'
import type { Locale } from './i18n/config'
import { getDictionary } from './i18n'
import { getInsightMessages, type InsightMessages } from './insights-messages'

// AnalysisResult['stats'] のように型の一部を取り出して短い名前を付けている（型エイリアス）
type Stats = AnalysisResult['stats']
type Scores = AnalysisResult['scores']

// weight が大きいほど「その人らしい」コメント。同じ category からは1つだけ選ぶ
interface Insight {
  category: string
  weight: number
  text: string
}

// ルールに渡す道具一式。M は文章、fmt はその言語の数値書式、axis は能力名（登坂力 / Climbing など）
interface Ctx {
  M: InsightMessages
  fmt: (n: number, digits?: number) => string
  axis: (key: keyof Scores) => string
}

function makeCtx(locale: Locale): Ctx {
  const M = getInsightMessages(locale)
  const axes = getDictionary(locale).axes
  return {
    M,
    // 数値をその言語の書式にする（日本語・英語 6,755.5 / ポルトガル語 6.755,5）。小数は digits 桁まで
    fmt: (n, digits = 0) => n.toLocaleString(M.numberLocale, { maximumFractionDigits: digits }),
    axis: (key) => axes[key],
  }
}

// 「stats・scores・道具を受け取ってコメント候補か null を返す関数」の配列。新しいコメントはここに関数を1つ足し、
// 文章を lib/insights-messages の型と各言語に足す
// 当てはまらないときは null を返す。weight は「その人らしさ」の強さで、珍しい特徴ほど大きくしている
const RULES: ((s: Stats, sc: Scores, c: Ctx) => Insight | null)[] = [
  // 獲得標高を身近な山・建物に換算（どの山かは言語ごと）
  (s, _, { M, fmt }) => {
    const m = s.totalElevationM
    const { hugeMountainM, mountainM, towerM } = M.analogs
    if (m >= hugeMountainM * 3) return { category: 'elevation', weight: 95, text: M.elevationHuge(fmt(m / hugeMountainM, 1), fmt(m)) }
    if (m >= mountainM) return { category: 'elevation', weight: 60 + Math.min(30, m / mountainM), text: M.elevationMountain(fmt(m / mountainM, 1), fmt(m)) }
    if (m >= towerM) return { category: 'elevation', weight: 35, text: M.elevationTower(fmt(m / towerM, 1), fmt(m)) }
    return null
  },
  // 総距離をその国の距離感に換算
  (s, _, { M, fmt }) => {
    const km = s.totalDistanceKm
    const { longRouteKm, shortRouteKm, shortRouteRoundTrip } = M.analogs
    const shortUnit = shortRouteKm * (shortRouteRoundTrip ? 2 : 1) // 往復で数える言語は2倍
    if (km >= longRouteKm) return { category: 'distance', weight: 85, text: M.distanceLong(fmt(km), fmt(km / longRouteKm, 1)) }
    if (km >= shortUnit) return { category: 'distance', weight: 65, text: M.distanceShort(fmt(km), fmt(km / shortUnit, 1)) }
    if (km >= 100) return { category: 'distance', weight: 30, text: M.distanceStart(fmt(km)) }
    return null
  },
  // 頻度
  (s, _, { M, fmt }) => {
    const w = s.ridingDaysPerWeek
    if (w >= 5) return { category: 'frequency', weight: 90, text: M.frequencyHigh(fmt(w, 1)) }
    if (w >= 3) return { category: 'frequency', weight: 55, text: M.frequencyMid(fmt(w, 1)) }
    if (w > 0 && w < 1) return { category: 'frequency', weight: 50, text: M.frequencyLow(fmt(w, 1)) }
    return null
  },
  // 1回あたりの距離
  (s, _, { M, fmt }) => {
    const d = s.avgDistanceKm
    if (d >= 100) return { category: 'avg_distance', weight: 85, text: M.avgDistanceLong(fmt(d, 1)) }
    if (d >= 60) return { category: 'avg_distance', weight: 45, text: M.avgDistanceMid(fmt(d, 1)) }
    if (d > 0 && d < 25) return { category: 'avg_distance', weight: 40, text: M.avgDistanceShort(fmt(d, 1)) }
    return null
  },
  // 平均速度（屋外ライドがない人は Zwift の速度なので出さない）
  (s, _, { M, fmt }) => {
    if (s.outdoorRides === 0) return null
    const v = s.avgSpeedKmh
    if (v >= 32) return { category: 'speed', weight: 85, text: M.speedHigh(fmt(v, 1)) }
    if (v >= 28) return { category: 'speed', weight: 55, text: M.speedMid(fmt(v, 1)) }
    return null
  },
  // 登坂比率
  (s, _, { M, fmt }) => {
    const r = s.climbingRatioMPerKm
    if (r >= 15) return { category: 'terrain', weight: 80, text: M.terrainSteep(fmt(r, 1)) }
    if (r >= 10) return { category: 'terrain', weight: 45, text: M.terrainHilly(fmt(r, 1)) }
    if (r > 0 && r <= 4) return { category: 'terrain', weight: 40, text: M.terrainFlat(fmt(r, 1)) }
    return null
  },
  // パワー
  (s, _, { M, fmt }) => {
    const w = s.avgWatts
    if (w >= 220) return { category: 'power', weight: 80, text: M.powerHigh(fmt(w)) }
    if (w >= 160) return { category: 'power', weight: 40, text: M.powerMid(fmt(w)) }
    if (w === 0) return { category: 'power', weight: 10, text: M.powerMeter }
    return null
  },
  // ローラー中心の人（週の本数で数える。1日に複数回乗る人もいるため日数ではない）
  (s, _, { M, fmt }) => {
    const indoor = s.indoorRides ?? 0
    if (indoor === 0 || s.totalRides === 0) return null
    const perWeek = indoor / (s.periodDays / 7)
    const share = Math.round((indoor / s.totalRides) * 100)
    if (perWeek >= 7 && (s.outdoorRides ?? 0) > 0) return { category: 'indoor', weight: 92, text: M.indoorWithOutdoor(fmt(perWeek, 1)) }
    if (perWeek >= 7) return { category: 'indoor', weight: 92, text: M.indoorOnly(fmt(perWeek, 1)) }
    if (share >= 70) return { category: 'indoor', weight: 60, text: M.indoorShare(String(share)) }
    return null
  },
  // パワーの使い方（実測パワーがある人だけ）
  (s, _, { M, fmt }) => {
    const peak = s.peakRatio ?? 0
    const vi = s.variabilityIndex ?? 0
    if (peak >= 6) return { category: 'power_style', weight: 75, text: M.powerSprint(fmt(peak, 1)) }
    if (vi > 0 && vi <= 1.05) return { category: 'power_style', weight: 70, text: M.powerSteady(fmt(vi, 2)) }
    if (vi >= 1.15) return { category: 'power_style', weight: 55, text: M.powerInterval(fmt(vi, 2)) }
    return null
  },
  // ライド回数
  (s, _, { M, fmt }) => {
    if (s.totalRides >= 100) return { category: 'rides', weight: 70, text: M.ridesMany(fmt(s.periodDays), fmt(s.totalRides)) }
    if (s.totalRides === 0) return { category: 'rides', weight: 90, text: M.ridesNone }
    return null
  },
  // 一番高い能力
  (_, sc, { M, axis }) => {
    const top = [...SCORE_KEYS].sort((a, b) => sc[b] - sc[a])[0]
    if (sc[top] < 50) return null
    return { category: 'strength', weight: 30 + sc[top] / 4, text: M.strength(axis(top), String(sc[top])) }
  },
  // 伸びしろ
  (_, sc, { M, axis }) => {
    const low = [...SCORE_KEYS].sort((a, b) => sc[a] - sc[b])[0]
    return { category: 'growth', weight: 20, text: M.growth(axis(low), String(sc[low])) }
  },
]

export function buildInsights(result: AnalysisResult, locale: Locale, max = 3): string[] {
  const ctx = makeCtx(locale)
  // 全ルールを実行し、null を取り除く。`(i): i is Insight =>` は型ガード付きの filter で、以降の配列を Insight[] として扱える
  const candidates = RULES.map((rule) => rule(result.stats, result.scores, ctx)).filter((i): i is Insight => i !== null)
  // Set は重複しない値の集まり。すでに選んだ category を覚えておき、同じ種類のコメントが2つ並ばないようにする
  const seen = new Set<string>()
  return candidates
    .sort((a, b) => b.weight - a.weight)
    // 初めて出てきた category なら覚えて残す（true）、2回目以降は捨てる（false）。`(a, b)` はカンマ演算子で、a を実行して b を返す
    .filter((i) => (seen.has(i.category) ? false : (seen.add(i.category), true)))
    .slice(0, max)
    .map((i) => i.text)
}

// 前回診断との比較コメント（ブラウザに保存した前回のキャラ・スコアだけを使う）
export function buildChangeInsights(prev: StoredResult, current: AnalysisResult, locale: Locale, now = new Date()): string[] {
  const { M, axis } = makeCtx(locale)
  const lines: string[] = []
  const days = Math.max(0, Math.round((now.getTime() - new Date(prev.date).getTime()) / 86_400_000))
  const diffs = SCORE_KEYS.map((k) => ({ label: axis(k), diff: current.scores[k] - prev.scores[k] }))
  // sort は元の配列を書き換えるので、[...diffs] でコピーしてから並べ替える。b - a は大きい順、a - b は小さい順
  const up = [...diffs].sort((a, b) => b.diff - a.diff)[0]
  const down = [...diffs].sort((a, b) => a.diff - b.diff)[0]

  if (up.diff >= 5) {
    lines.push(M.changeUp(days, up.label, String(up.diff)))
  } else if (diffs.every((d) => Math.abs(d.diff) < 5)) {
    lines.push(M.changeFlat)
  }
  if (down.diff <= -10) {
    lines.push(M.changeDown(down.label, String(down.diff)))
  }
  return lines
}
