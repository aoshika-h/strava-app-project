'use client'
// 結果表示クライアントコンポーネント
// キャラクターカード風のUIで診断結果を表示する

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CHARACTERS, type AnalysisResult, type CharacterId } from '@/lib/character'
import ShareCard from './ShareCard'

const CHARACTER_IDS: CharacterId[] = ['climber', 'sprinter', 'tt', 'granfondo', 'allrounder', 'weekend']

function buildPreviewResult(characterId: CharacterId, sex: 'male' | 'female'): AnalysisResult {
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
      ridesPerWeek: 3.5,
      avgWatts: 210,
      periodDays: 90,
    },
    scores: { climbing: 75, speed: 68, endurance: 80, power: 65, consistency: 72 },
  }
}

// ---- レーダーチャートコンポーネント ----
function RadarChart({ scores, color }: { scores: AnalysisResult['scores']; color: string }) {
  const size = 220
  const center = size / 2
  const radius = 82

  const axes = [
    { label: '登坂力', key: 'climbing' as const },
    { label: 'スピード', key: 'speed' as const },
    { label: '持久力', key: 'endurance' as const },
    { label: '出力', key: 'power' as const },
    { label: '継続性', key: 'consistency' as const },
  ]
  const n = axes.length

  const getPoint = (index: number, value: number) => {
    const angle = (index / n) * 2 * Math.PI - Math.PI / 2
    const r = (value / 100) * radius
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) }
  }

  const gridPolygon = (pct: number) =>
    axes.map((_, i) => { const p = getPoint(i, pct); return `${p.x},${p.y}` }).join(' ')

  const dataPolygon = axes.map((a, i) => {
    const p = getPoint(i, scores[a.key]); return `${p.x},${p.y}`
  }).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {[25, 50, 75, 100].map((pct) => (
        <polygon key={pct} points={gridPolygon(pct)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      {axes.map((_, i) => {
        const p = getPoint(i, 100)
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      })}
      <polygon points={dataPolygon} fill={`${color}35`} stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {axes.map((a, i) => {
        const p = getPoint(i, scores[a.key])
        return <circle key={a.key} cx={p.x} cy={p.y} r="4" fill={color} />
      })}
      {axes.map((a, i) => {
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

// ---- メインコンポーネント ----
export default function ResultContent() {
  const searchParams = useSearchParams()
  const dataParam = searchParams.get('data')
  const previewParam = searchParams.get('preview') as CharacterId | null
  const sexParam = searchParams.get('sex') === 'female' ? 'female' : 'male'

  // ?preview=climber&sex=female でテスト表示（dataパラメータより優先）
  if (previewParam && CHARACTER_IDS.includes(previewParam)) {
    const result = buildPreviewResult(previewParam, sexParam)
    const character = CHARACTERS[result.characterId]
    const { stats, scores } = result
    return <ResultView result={result} character={character} stats={stats} scores={scores} isPreview />
  }

  if (!dataParam) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-center p-6">
        <div>
          <p className="text-white/50 mb-4">診断データが見つかりません</p>
          <Link href="/" className="text-orange-400 hover:underline">トップに戻る</Link>
        </div>
      </div>
    )
  }

  let result: AnalysisResult
  try {
    result = JSON.parse(atob(dataParam.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-center p-6">
        <div>
          <p className="text-white/50 mb-4">データの読み込みに失敗しました</p>
          <Link href="/" className="text-orange-400 hover:underline">もう一度診断する</Link>
        </div>
      </div>
    )
  }

  const character = CHARACTERS[result.characterId]
  const { stats, scores } = result
  return <ResultView result={result} character={character} stats={stats} scores={scores} />
}

// ---- 結果表示ビュー（プレビュー・本番共用） ----
function ResultView({
  result,
  character,
  stats,
  scores,
  isPreview = false,
}: {
  result: AnalysisResult
  character: (typeof CHARACTERS)[keyof typeof CHARACTERS]
  stats: AnalysisResult['stats']
  scores: AnalysisResult['scores']
  isPreview?: boolean
}) {
  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white">

      {/* プレビューバナー */}
      {isPreview && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/30 text-yellow-400 text-xs text-center py-2 tracking-widest">
          ⚡ PREVIEW MODE — テスト表示中
        </div>
      )}

      {/* ========== コンテンツエリア ========== */}
      <div className="max-w-2xl mx-auto px-6 pt-8 pb-16 space-y-6">

        {/* シェアカード（ページ最上部） */}
        <ShareCard character={character} characterId={result.characterId} athleteName={result.athleteName} sex={result.sex} />

        {/* キャラクター説明 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-white/80 leading-relaxed mb-4">{character.description}</p>
          <p className="text-sm text-white/40 leading-relaxed border-t border-white/10 pt-4">
            📖 {character.lore}
          </p>
        </div>

        {/* ライド統計 */}
        <div>
          <h2 className="text-sm font-bold text-white/40 tracking-widest uppercase mb-3">Battle Records</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: '合計距離', value: `${stats.totalDistanceKm.toLocaleString()} km`, icon: '🛣️' },
              { label: '平均距離', value: `${stats.avgDistanceKm} km`, icon: '📏' },
              { label: '平均速度', value: `${stats.avgSpeedKmh} km/h`, icon: '⚡' },
              { label: '総獲得標高', value: `${stats.totalElevationM.toLocaleString()} m`, icon: '🏔️' },
              { label: '山岳比率', value: `${stats.climbingRatioMPerKm} m/km`, icon: '📈' },
              { label: '週頻度', value: `${stats.ridesPerWeek} 回/週`, icon: '📅' },
              ...(stats.avgWatts > 0 ? [{ label: '平均パワー', value: `${stats.avgWatts} W`, icon: '💪' }] : []),
            ].map((item) => (
              <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="font-bold text-base">{item.value}</div>
                <div className="text-xs text-white/35 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 能力チャート */}
        <div>
          <h2 className="text-sm font-bold text-white/40 tracking-widest uppercase mb-3">Ability Chart</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="md:flex items-center gap-6">
              <div className="flex-shrink-0 mb-4 md:mb-0">
                <RadarChart scores={scores} color={character.accentColor} />
              </div>
              <div className="flex-1 space-y-3">
                {[
                  { label: '登坂力', key: 'climbing' as const },
                  { label: 'スピード', key: 'speed' as const },
                  { label: '持久力', key: 'endurance' as const },
                  { label: '出力', key: 'power' as const },
                  { label: '継続性', key: 'consistency' as const },
                ].map((item) => (
                  <div key={item.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{item.label}</span>
                      <span className="font-bold" style={{ color: character.accentColor }}>
                        {scores[item.key]}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${scores[item.key]}%`, backgroundColor: character.accentColor }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 強み */}
        <div>
          <h2 className="text-sm font-bold text-white/40 tracking-widest uppercase mb-3">Strengths</h2>
          <div className="flex flex-wrap gap-2">
            {character.strengths.map((s) => (
              <span
                key={s}
                className="px-3 py-1.5 rounded-full text-sm font-bold border"
                style={{
                  borderColor: `${character.accentColor}50`,
                  backgroundColor: `${character.accentColor}18`,
                  color: character.accentColor,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* トレーニングアドバイス */}
        <div>
          <h2 className="text-sm font-bold text-white/40 tracking-widest uppercase mb-3">Level Up</h2>
          <div className="space-y-3">
            {character.tips.map((tip, i) => (
              <div key={i} className="flex gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <span
                  className="text-sm font-black w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${character.accentColor}30`, color: character.accentColor }}
                >
                  {i + 1}
                </span>
                <p className="text-sm text-white/70 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* もう一度診断 */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 hover:text-white font-medium px-8 py-3 rounded-xl transition-colors text-sm"
          >
            ← もう一度診断する
          </Link>
        </div>
      </div>
    </main>
  )
}
