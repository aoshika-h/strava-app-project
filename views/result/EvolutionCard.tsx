// 前回診断からのキャラクター・スコアの変化

import type { AnalysisResult } from '@/models/analysis'
import { getCharacter, getVariant } from '@/models/characters'
import type { StoredResult } from '@/models/resultHistory'
import { SCORE_AXES } from './scoreAxes'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

export default function EvolutionCard({ prev, current }: { prev: StoredResult; current: AnalysisResult }) {
  const prevChar = getCharacter(prev.characterId)
  const prevName = getVariant(prev.characterId, current.sex).name
  const currChar = getCharacter(current.characterId)
  const currName = getVariant(current.characterId, current.sex).name
  const changed = prev.characterId !== current.characterId

  return (
    <div>
      <h2 className="text-sm font-bold text-white/40 tracking-widest uppercase mb-3">Character Evolution</h2>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">

        {/* キャラクター変化 */}
        <div className="flex items-center justify-center gap-3 mb-5">
          {changed ? (
            <>
              <div className="text-center">
                <div className="text-2xl mb-1">{prevChar.emoji}</div>
                <div className="text-xs text-white/40 font-bold">{prevName}</div>
              </div>
              <div className="text-white/30 text-lg font-thin">→</div>
              <div className="text-center">
                <div className="text-2xl mb-1">{currChar.emoji}</div>
                <div className="text-xs font-bold" style={{ color: currChar.accentColor }}>{currName}</div>
              </div>
              <div
                className="ml-2 text-xs font-black px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${currChar.accentColor}25`, color: currChar.accentColor }}
              >
                進化！
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl">{currChar.emoji}</div>
              <div className="text-sm font-bold" style={{ color: currChar.accentColor }}>
                {currName} を維持中
              </div>
            </>
          )}
        </div>

        {/* スコア差分 */}
        <div className="grid grid-cols-5 gap-2">
          {SCORE_AXES.map(({ label, key }) => {
            const diff = current.scores[key] - prev.scores[key]
            const color = diff > 0 ? '#34D399' : diff < 0 ? '#F87171' : 'rgba(255,255,255,0.3)'
            return (
              <div key={key} className="text-center">
                <div className="text-xs text-white/40 mb-1">{label}</div>
                <div className="text-sm font-black" style={{ color }}>
                  {diff > 0 ? `+${diff}` : diff === 0 ? '±0' : diff}
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center mt-4 text-xs text-white/20">
          前回の診断: {formatDate(prev.date)}
        </div>
      </div>
    </div>
  )
}
