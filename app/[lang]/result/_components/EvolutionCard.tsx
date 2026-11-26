// 前回診断からのキャラクター・スコアの変化
// 結果ページで、同じ期間の前回結果がブラウザに保存されているときだけ出す（ResultView が渡す）
// 学べること: 三項演算子で2通りの表示を切り替える、<>...</>（Fragment: 余計な div を増やさずにまとめる）
// 日付・期間の書き方は言語で違うので、辞書（formatDate・evolution.period）に持たせている

import type { AnalysisResult } from '@/lib/analysis'
import { getCharacter, getVariant } from '@/lib/characters'
import type { StoredResult } from '@/lib/result-history'
import { buildChangeInsights } from '@/lib/insights'
import { SCORE_KEYS } from '@/lib/score-axes'
import { getDictionary, type Locale } from '@/lib/i18n'

export default function EvolutionCard({ lang, prev, current }: { lang: Locale; prev: StoredResult; current: AnalysisResult }) {
  const t = getDictionary(lang)
  const prevChar = getCharacter(prev.characterId, lang)
  const prevName = getVariant(prev.characterId, current.sex, lang).name
  const currChar = getCharacter(current.characterId, lang)
  const currName = getVariant(current.characterId, current.sex, lang).name
  const changed = prev.characterId !== current.characterId

  return (
    <div>
      <h2 className="text-sm font-bold text-white/55 tracking-widest uppercase mb-3">Character Evolution</h2>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">

        {/* キャラクター変化 */}
        <div className="flex items-center justify-center gap-3 mb-5">
          {changed ? (
            <>
              <div className="text-center">
                <div className="text-2xl mb-1">{prevChar.emoji}</div>
                <div className="text-xs text-white/55 font-bold">{prevName}</div>
              </div>
              <div className="text-white/55 text-lg font-thin">→</div>
              <div className="text-center">
                <div className="text-2xl mb-1">{currChar.emoji}</div>
                <div className="text-xs font-bold" style={{ color: currChar.accentColor }}>{currName}</div>
              </div>
              <div
                className="ml-2 text-xs font-black px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${currChar.accentColor}25`, color: currChar.accentColor }}
              >
                {t.evolution.evolved}
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl">{currChar.emoji}</div>
              <div className="text-sm font-bold" style={{ color: currChar.accentColor }}>
                {t.evolution.keeping(currName)}
              </div>
            </>
          )}
        </div>

        {/* スコア差分 */}
        <div className="grid grid-cols-5 gap-2">
          {SCORE_KEYS.map((key) => {
            // 5つの能力それぞれで今回−前回を出し、増えたら緑・減ったら赤にする
            const diff = current.scores[key] - prev.scores[key]
            const color = diff > 0 ? '#34D399' : diff < 0 ? '#F87171' : 'rgba(255,255,255,0.3)'
            return (
              <div key={key} className="text-center">
                <div className="text-xs text-white/55 mb-1">{t.axes[key]}</div>
                <div className="text-sm font-black" style={{ color }}>
                  {diff > 0 ? `+${diff}` : diff === 0 ? '±0' : diff}
                </div>
              </div>
            )
          })}
        </div>

        {buildChangeInsights(prev, current, lang).map((line) => (
          <p key={line} className="mt-4 text-sm text-white/70 text-center">{line}</p>
        ))}

        <div className="text-center mt-4 text-xs text-white/55">
          {t.evolution.previous(t.evolution.period(prev.periodDays), t.formatDate(prev.date))}
        </div>
      </div>
    </div>
  )
}
