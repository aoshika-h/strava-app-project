'use client'
// 結果表示クライアントコンポーネント
// URLパラメータからデータをデコードして診断結果を表示する

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CHARACTERS, type AnalysisResult } from '@/lib/character'

// ---- レーダーチャートコンポーネント ----
// 5軸の六角形チャートをSVGで描画
function RadarChart({ scores, color }: { scores: AnalysisResult['scores']; color: string }) {
  const size = 240
  const center = size / 2
  const radius = 90  // 最大半径

  const axes = [
    { label: '登坂力', key: 'climbing' as const },
    { label: 'スピード', key: 'speed' as const },
    { label: '持久力', key: 'endurance' as const },
    { label: '出力', key: 'power' as const },
    { label: '継続性', key: 'consistency' as const },
  ]

  const n = axes.length

  // 角度から座標を計算（上から時計回り）
  const getPoint = (index: number, value: number) => {
    const angle = (index / n) * 2 * Math.PI - Math.PI / 2
    const r = (value / 100) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  // グリッドライン用（同心多角形）
  const gridPolygon = (pct: number) =>
    axes.map((_, i) => {
      const p = getPoint(i, pct)
      return `${p.x},${p.y}`
    }).join(' ')

  // データポイントのポリゴン
  const dataPolygon = axes.map((a, i) => {
    const p = getPoint(i, scores[a.key])
    return `${p.x},${p.y}`
  }).join(' ')

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto"
    >
      {/* グリッドライン（25/50/75/100%） */}
      {[25, 50, 75, 100].map((pct) => (
        <polygon
          key={pct}
          points={gridPolygon(pct)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}

      {/* 各軸のライン */}
      {axes.map((_, i) => {
        const p = getPoint(i, 100)
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        )
      })}

      {/* データポリゴン（半透明塗りつぶし） */}
      <polygon
        points={dataPolygon}
        fill={`${color}40`}  // 25%透過
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* データポイントの点 */}
      {axes.map((a, i) => {
        const p = getPoint(i, scores[a.key])
        return (
          <circle
            key={a.key}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={color}
          />
        )
      })}

      {/* 軸ラベル（外側に配置） */}
      {axes.map((a, i) => {
        const p = getPoint(i, 130)  // 半径の外側に配置
        return (
          <text
            key={a.key}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fill="rgba(255,255,255,0.6)"
            fontFamily="sans-serif"
          >
            {a.label}
          </text>
        )
      })}
    </svg>
  )
}

// ---- ステータスバーコンポーネント ----
function StatBar({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white/70">{label}</span>
        <span className="font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        {/* CSSカスタムプロパティでアニメーション幅を設定 */}
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${value}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}

// ---- メインコンポーネント ----
export default function ResultContent() {
  const searchParams = useSearchParams()
  const dataParam = searchParams.get('data')

  // URLパラメータが存在しない場合
  if (!dataParam) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-center p-6">
        <div>
          <p className="text-white/50 mb-4">診断データが見つかりません</p>
          <Link href="/" className="text-orange-400 hover:underline">
            トップページに戻る
          </Link>
        </div>
      </div>
    )
  }

  // Base64デコードして診断結果を復元
  let result: AnalysisResult
  try {
    result = JSON.parse(atob(dataParam.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-center p-6">
        <div>
          <p className="text-white/50 mb-4">データの読み込みに失敗しました</p>
          <Link href="/" className="text-orange-400 hover:underline">
            もう一度診断する
          </Link>
        </div>
      </div>
    )
  }

  const character = CHARACTERS[result.characterId]
  const { stats, scores } = result

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white">
      {/* ヘッダー：キャラクターカード */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${character.colorClass} pt-16 pb-12`}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_100%,white,transparent_70%)]" />
        <div className="relative max-w-2xl mx-auto px-6 text-center animate-fade-in">
          {/* アスリート名 */}
          <p className="text-white/70 text-sm mb-2">{result.athleteName} さん</p>

          {/* キャラクター絵文字 */}
          <div className="text-8xl mb-4 drop-shadow-lg">{character.emoji}</div>

          {/* キャラクター名 */}
          <h1 className="text-4xl md:text-5xl font-black mb-2">
            {character.name}
          </h1>

          {/* サブタイトル */}
          <p className="text-xl text-white/80 font-medium mb-1">{character.subtitle}</p>

          {/* 診断バッジ */}
          <div className="inline-block bg-black/20 rounded-full px-4 py-1 text-sm text-white/70 mt-2">
            直近{stats.periodDays}日間 · {stats.totalRides}ライド分析
          </div>
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8 animate-slide-up">

        {/* キャラクター説明 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-white/80 leading-relaxed">{character.description}</p>
        </div>

        {/* ライド統計 */}
        <div>
          <h2 className="text-lg font-bold mb-4 text-white/80">📊 ライド統計</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: '合計距離', value: `${stats.totalDistanceKm.toLocaleString()} km`, icon: '🛣️' },
              { label: '平均距離', value: `${stats.avgDistanceKm} km`, icon: '📏' },
              { label: '平均速度', value: `${stats.avgSpeedKmh} km/h`, icon: '⚡' },
              { label: '獲得標高', value: `${stats.totalElevationM.toLocaleString()} m`, icon: '🏔️' },
              { label: '山岳比率', value: `${stats.climbingRatioMPerKm} m/km`, icon: '📈' },
              { label: '週頻度', value: `${stats.ridesPerWeek} 回/週`, icon: '📅' },
              ...(stats.avgWatts > 0
                ? [{ label: '平均パワー', value: `${stats.avgWatts} W`, icon: '💪' }]
                : []),
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="font-bold text-lg">{item.value}</div>
                <div className="text-xs text-white/40">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* レーダーチャート + スコアバー */}
        <div>
          <h2 className="text-lg font-bold mb-4 text-white/80">🕸️ 能力チャート</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="md:flex items-center gap-8">
              {/* レーダーチャート */}
              <div className="flex-shrink-0 mb-6 md:mb-0">
                <RadarChart scores={scores} color={character.accentColor} />
              </div>

              {/* スコアバー */}
              <div className="flex-1 space-y-4">
                {[
                  { label: '登坂力', key: 'climbing' as const },
                  { label: 'スピード', key: 'speed' as const },
                  { label: '持久力', key: 'endurance' as const },
                  { label: '出力', key: 'power' as const },
                  { label: '継続性', key: 'consistency' as const },
                ].map((item) => (
                  <StatBar
                    key={item.key}
                    label={item.label}
                    value={scores[item.key]}
                    color={character.accentColor}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 強み */}
        <div>
          <h2 className="text-lg font-bold mb-4 text-white/80">💪 あなたの強み</h2>
          <div className="flex flex-wrap gap-2">
            {character.strengths.map((s) => (
              <span
                key={s}
                className="px-3 py-1.5 rounded-full text-sm font-medium border"
                style={{
                  borderColor: `${character.accentColor}60`,
                  backgroundColor: `${character.accentColor}20`,
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
          <h2 className="text-lg font-bold mb-4 text-white/80">🚀 さらに伸びるために</h2>
          <div className="space-y-3">
            {character.tips.map((tip, i) => (
              <div
                key={i}
                className="flex gap-3 bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <span className="text-lg flex-shrink-0">{'①②③'[i]}</span>
                <p className="text-sm text-white/70 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* もう一度診断ボタン */}
        <div className="text-center pt-4 pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium px-8 py-3 rounded-xl transition-colors"
          >
            ← もう一度診断する
          </Link>
        </div>
      </div>
    </main>
  )
}
