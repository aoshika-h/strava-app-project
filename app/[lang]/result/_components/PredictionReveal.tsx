// 診断前の予想タイプと結果の答え合わせ
// 結果ページの一番上に、予想したときだけ出す（ResultView が localStorage から予想を取り出して渡す）
// 学べること: 2つの props を比べて表示を変える、grid で「予想 → 結果」を横並びにする

import { getCharacter, type CharacterId } from '@/lib/characters'
import { getDictionary, type Locale } from '@/lib/i18n'

export default function PredictionReveal({ lang, predicted, actual }: { lang: Locale; predicted: CharacterId; actual: CharacterId }) {
  const t = getDictionary(lang).reveal
  const p = getCharacter(predicted, lang)
  const a = getCharacter(actual, lang)
  const hit = predicted === actual

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-center">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div>
          <div className="text-xs text-white/40">{t.yourGuess}</div>
          <div className="text-sm font-bold" style={{ color: p.accentColor }}>{p.typeName}</div>
        </div>
        <div className="text-white/30">→</div>
        <div>
          <div className="text-xs text-white/40">{t.result}</div>
          <div className="text-sm font-bold" style={{ color: a.accentColor }}>{a.typeName}</div>
        </div>
      </div>
      <p className="mt-2 text-base font-black" style={{ color: hit ? a.accentColor : '#fff' }}>
        {hit ? t.hit : t.miss}
      </p>
    </div>
  )
}
