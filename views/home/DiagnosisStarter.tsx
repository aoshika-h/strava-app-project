'use client'
// 診断の入り口: ① タイプを予想 → ② 期間を選んで診断

import { useState } from 'react'
import Image from 'next/image'
import { listCharacters } from '@/models/characters'
import type { PredictedType } from '@/models/prediction'
import PeriodButtons from './PeriodButtons'

export default function DiagnosisStarter() {
  const [predicted, setPredicted] = useState<PredictedType | null>(null)
  const characters = listCharacters()
  const picked = predicted && predicted !== 'unknown' ? characters.find((c) => c.id === predicted) : null

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <p className="text-base font-bold text-white/80">① あなたのタイプはどれだと思う？</p>

      <div className="grid grid-cols-3 gap-2 w-full max-w-md">
        {characters.map((c) => {
          const selected = predicted === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setPredicted(c.id)}
              aria-pressed={selected}
              className="rounded-xl overflow-hidden border-2 bg-white/5 transition-all"
              style={{
                borderColor: selected ? c.accentColor : 'rgba(255,255,255,0.1)',
                boxShadow: selected ? `0 0 16px ${c.accentColor}66` : 'none',
              }}
            >
              <div className="relative h-16">
                <Image src={`/characters/${c.id}_male.png`} alt="" fill sizes="140px" className="object-cover object-top" />
              </div>
              <div className="px-1 py-1.5 text-[11px] font-bold leading-tight" style={{ color: selected ? c.accentColor : 'rgba(255,255,255,0.75)' }}>
                {c.typeName}
              </div>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setPredicted('unknown')}
        aria-pressed={predicted === 'unknown'}
        className={`text-xs underline underline-offset-2 ${predicted === 'unknown' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
      >
        わからない・予想しない
      </button>

      {predicted && (
        <div className="flex flex-col items-center gap-3 mt-4">
          <p className="text-base font-bold text-white/80">② 分析する期間を選んで診断！</p>
          {picked && (
            <p className="text-xs text-white/50">
              あなたの予想：<span className="font-bold" style={{ color: picked.accentColor }}>{picked.typeName}</span>
            </p>
          )}
          <PeriodButtons predicted={predicted} />
        </div>
      )}
    </div>
  )
}
