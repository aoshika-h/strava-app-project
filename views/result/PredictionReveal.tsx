// 診断前の予想タイプと結果の答え合わせ

import { getCharacter, type CharacterId } from '@/models/characters'

export default function PredictionReveal({ predicted, actual }: { predicted: CharacterId; actual: CharacterId }) {
  const p = getCharacter(predicted)
  const a = getCharacter(actual)
  const hit = predicted === actual

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-center">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div>
          <div className="text-xs text-white/40">あなたの予想</div>
          <div className="text-sm font-bold" style={{ color: p.accentColor }}>{p.typeName}</div>
        </div>
        <div className="text-white/30">→</div>
        <div>
          <div className="text-xs text-white/40">診断結果</div>
          <div className="text-sm font-bold" style={{ color: a.accentColor }}>{a.typeName}</div>
        </div>
      </div>
      <p className="mt-2 text-base font-black" style={{ color: hit ? a.accentColor : '#fff' }}>
        {hit ? '予想的中！自分の走りをよくわかっている' : '意外な一面！データが見ていたあなたの走り'}
      </p>
    </div>
  )
}
