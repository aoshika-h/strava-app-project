'use client'
// 診断結果ページ本体。app/result/page.tsx（サーバー）がURLの結果データを復元し、props で渡してくる
// 学べること: サーバーで用意したデータを受け取るクライアントコンポーネント、useEffect でブラウザの保存領域
// （localStorage）を読み書きする、条件付き表示（&&）、配列を組み立てて .map で並べる、部品（子コンポーネント）の組み合わせ
// 'use client': 前回結果の読み書き（localStorage）や state を使うため、ブラウザで動かす必要がある

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { AnalysisResult } from '@/lib/analysis'
import { getCharacter, type CharacterId } from '@/lib/characters'
import { loadLastResult, saveLastResult, type StoredResult } from '@/lib/result-history'
import ShareCard from './ShareCard'
import EvolutionCard from './EvolutionCard'
import RadarChart from './RadarChart'
import InsightsCard from './InsightsCard'
import PredictionReveal from './PredictionReveal'
import { takePrediction } from '@/lib/prediction'
import { SCORE_AXES } from '@/lib/score-axes'

// 引数を { result, insights, ... } と分解して受け取る（props の分割代入）。isPreview = false は省略時の既定値
export default function ResultView({
  result,
  insights,
  sharePath,
  isPreview = false,
}: {
  result: AnalysisResult
  insights: string[]
  sharePath: string
  isPreview?: boolean
}) {
  const character = getCharacter(result.characterId)
  const { stats, scores } = result
  // 屋内ライドが混ざっているときは、実走だけで計算した項目だとわかるようにする
  const outdoorTag =
    stats.outdoorRides === 0 && stats.totalRides > 0
      ? '（屋内）'
      : stats.outdoorRides && stats.outdoorRides < stats.totalRides
        ? '（屋外）'
        : ''
  // 前回の結果と診断前の予想はブラウザの localStorage にある。サーバーでは読めないので最初は null にしておき、
  // 画面が出たあと useEffect の中で読み込む（サーバーとブラウザの最初の描画をそろえて hydration エラーを防ぐ）
  const [prevResult, setPrevResult] = useState<StoredResult | null>(null)
  const [predicted, setPredicted] = useState<CharacterId | null>(null)

  // 第2引数の [] は「最初に表示されたときに1回だけ実行する」という意味
  useEffect(() => {
    if (isPreview) return
    setPredicted(takePrediction())
    setPrevResult(loadLastResult(result.stats.periodDays)) // 先に前回分を読んでから
    saveLastResult(result) // 今回分で上書きする（順番を逆にすると、今回と今回を比べてしまう）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white">

      {/* プレビューバナー */}
      {isPreview && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/30 text-yellow-400 text-xs text-center py-2 tracking-widest">
          ⚡ PREVIEW MODE — テスト表示中
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 pt-8 pb-16 space-y-6">

        {/* 診断前の予想との答え合わせ（予想した場合のみ）。{条件 && <部品 />} は条件が真のときだけ表示する書き方 */}
        {predicted && <PredictionReveal predicted={predicted} actual={result.characterId} />}

        {/* シェアカード */}
        <ShareCard
          character={character}
          characterId={result.characterId}
          sex={result.sex}
          sharePath={sharePath}
        />

        {/* ライドの数値から組み立てた一言コメント（本人だけに表示） */}
        <InsightsCard insights={insights} accentColor={character.accentColor} />

        {/* キャラクター変化（前回診断がある場合のみ表示） */}
        {prevResult && <EvolutionCard prev={prevResult} current={result} />}

        {/* ライド統計 */}
        <div>
          <h2 className="text-sm font-bold text-white/40 tracking-widest uppercase mb-3">Battle Records</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              // カードの中身を配列で組み立ててから .map で並べる。...（スプレッド構文）で、条件によって
              // 配列の一部を入れたり入れなかったりしている
              // 距離が記録されないローラー練習（ERG など）だけの人は、距離・速度・標高のカードを出さない
              ...(stats.totalDistanceKm > 0
                ? [
                    { label: '合計距離', value: `${stats.totalDistanceKm.toLocaleString()} km`, icon: '🛣️' },
                    { label: `平均距離${outdoorTag}`, value: `${stats.avgDistanceKm} km`, icon: '📏' },
                    { label: `平均速度${outdoorTag}`, value: `${stats.avgSpeedKmh} km/h`, icon: '⚡' },
                    { label: '総獲得標高', value: `${stats.totalElevationM.toLocaleString()} m`, icon: '🏔️' },
                    { label: `山岳比率${outdoorTag}`, value: `${stats.climbingRatioMPerKm} m/km`, icon: '📈' },
                  ]
                : []),
              { label: '乗った日数', value: `週${stats.ridingDaysPerWeek}日`, icon: '📅' },
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

        {/* 能力チャート。左がレーダーチャート、右が数値のバー（バーの幅を style の width: % で指定） */}
        <div>
          <h2 className="text-sm font-bold text-white/40 tracking-widest uppercase mb-3">Ability Chart</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="md:flex items-center gap-6">
              <div className="flex-shrink-0 mb-4 md:mb-0">
                <RadarChart scores={scores} color={character.accentColor} />
              </div>
              <div className="flex-1 space-y-3">
                {SCORE_AXES.map((item) => (
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
            data-ga-event="retry_diagnosis"
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
