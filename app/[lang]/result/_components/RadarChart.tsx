// 結果ページの能力レーダーチャート（5角形）。ライブラリを使わず SVG で直接描いている。ResultView が使う
// 学べること: 三角関数（cos・sin）で角度と長さから座標を出す、SVG の polygon / line / circle / text
// 状態を持たない純粋な表示部品なので 'use client' は付けていない（親がクライアントなのでブラウザでも動く）

import type { AnalysisResult } from '@/lib/analysis'
import { SCORE_KEYS } from '@/lib/score-axes'
import { getDictionary, type Locale } from '@/lib/i18n'

export default function RadarChart({ lang, scores, color }: { lang: Locale; scores: AnalysisResult['scores']; color: string }) {
  const axes = getDictionary(lang).axes // 軸ラベル（登坂力 / Climbing / Subida …）
  const size = 220
  const center = size / 2
  const radius = 82
  const n = SCORE_KEYS.length

  // index 番目の軸の上で、中心から value%（0〜100）の位置の座標を返す。
  // 角度は 1周（2π）を軸の数で割り、-π/2 ずらして1本目の軸を真上から始める。
  // 画面の座標は下に行くほど y が大きいので、cos が x、sin が y になる
  const getPoint = (index: number, value: number) => {
    const angle = (index / n) * 2 * Math.PI - Math.PI / 2
    const r = (value / 100) * radius
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) }
  }

  // 目盛りの5角形（25%・50%・75%・100%）。polygon の points は "x,y x,y ..." という文字列で渡す
  const gridPolygon = (pct: number) =>
    SCORE_KEYS.map((_, i) => { const p = getPoint(i, pct); return `${p.x},${p.y}` }).join(' ')

  // 実際のスコアを結んだ5角形
  const dataPolygon = SCORE_KEYS.map((key, i) => {
    const p = getPoint(i, scores[key]); return `${p.x},${p.y}`
  }).join(' ')

  // viewBox を四方に25ずつ広げているのは、外側に置く軸ラベル（128%の位置）が見切れないようにするため
  return (
    <svg width={size} height={size} viewBox={`-25 -25 ${size + 50} ${size + 50}`} className="mx-auto">
      {[25, 50, 75, 100].map((pct) => (
        <polygon key={pct} points={gridPolygon(pct)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      {SCORE_KEYS.map((_, i) => {
        const p = getPoint(i, 100)
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      })}
      <polygon points={dataPolygon} fill={`${color}35`} stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {SCORE_KEYS.map((key, i) => {
        const p = getPoint(i, scores[key])
        return <circle key={key} cx={p.x} cy={p.y} r="4" fill={color} />
      })}
      {SCORE_KEYS.map((key, i) => {
        const p = getPoint(i, 128)
        return (
          <text key={key} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="10.5" fill="rgba(255,255,255,0.55)" fontFamily="sans-serif">
            {axes[key]}
          </text>
        )
      })}
    </svg>
  )
}
