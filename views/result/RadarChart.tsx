import type { AnalysisResult } from '@/models/analysis'
import { SCORE_AXES } from './scoreAxes'

export default function RadarChart({ scores, color }: { scores: AnalysisResult['scores']; color: string }) {
  const size = 220
  const center = size / 2
  const radius = 82
  const n = SCORE_AXES.length

  const getPoint = (index: number, value: number) => {
    const angle = (index / n) * 2 * Math.PI - Math.PI / 2
    const r = (value / 100) * radius
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) }
  }

  const gridPolygon = (pct: number) =>
    SCORE_AXES.map((_, i) => { const p = getPoint(i, pct); return `${p.x},${p.y}` }).join(' ')

  const dataPolygon = SCORE_AXES.map((a, i) => {
    const p = getPoint(i, scores[a.key]); return `${p.x},${p.y}`
  }).join(' ')

  return (
    <svg width={size} height={size} viewBox={`-25 -25 ${size + 50} ${size + 50}`} className="mx-auto">
      {[25, 50, 75, 100].map((pct) => (
        <polygon key={pct} points={gridPolygon(pct)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      {SCORE_AXES.map((_, i) => {
        const p = getPoint(i, 100)
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      })}
      <polygon points={dataPolygon} fill={`${color}35`} stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {SCORE_AXES.map((a, i) => {
        const p = getPoint(i, scores[a.key])
        return <circle key={a.key} cx={p.x} cy={p.y} r="4" fill={color} />
      })}
      {SCORE_AXES.map((a, i) => {
        const p = getPoint(i, 128)
        return (
          <text key={a.key} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="10.5" fill="rgba(255,255,255,0.55)" fontFamily="sans-serif">
            {a.label}
          </text>
        )
      })}
    </svg>
  )
}
