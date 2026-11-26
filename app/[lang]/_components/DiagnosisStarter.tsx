'use client'
// 診断の入り口: ① タイプを予想 → ② 期間を選んで診断
// トップページ（app/[lang]/page.tsx）のファーストビューで使う。
// 学べること: useState で「選択中の状態」を持つ、条件付き表示（&&）、配列を .map で並べる（key）、
// 子コンポーネント（PeriodButtons）に props で値を渡す、チェックボックスを state で管理する（制御コンポーネント）
// 'use client': ボタンのクリックや state を使うので、ブラウザで動くクライアントコンポーネントにする必要がある

import { useState } from 'react'
import Image from 'next/image'
import { listCharacters } from '@/lib/characters'
import { getDictionary, type Locale } from '@/lib/i18n'
import type { PredictedType } from '@/lib/prediction'
import PeriodButtons from './PeriodButtons'

// lang はページ（サーバー）から props で受け取る。辞書は文字だけのデータなので、ブラウザ側の部品でもそのまま読める
export default function DiagnosisStarter({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).starter
  // useState: [今の値, 値を変える関数] の組を返す。値を変えると、このコンポーネントが描き直される
  // null は「まだ何も選んでいない」。選ぶまで ② の期間ボタンを出さないために使う
  const [predicted, setPredicted] = useState<PredictedType | null>(null)
  const [includePrivate, setIncludePrivate] = useState(false)
  const characters = listCharacters(lang)
  // 予想したキャラの情報（名前・色）。「わからない」を選んだときは null
  const picked = predicted && predicted !== 'unknown' ? characters.find((c) => c.id === predicted) : null

  // return の中は JSX（HTML に似た書き方で画面を表す）。class ではなく className、{} の中に JavaScript の値を書く

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <p className="text-base font-bold text-white/80">{t.step1}</p>

      <div className="grid grid-cols-3 gap-2 w-full max-w-md">
        {characters.map((c) => {
          // .map で6キャラ分のボタンを作る。key は React が「どの要素がどれか」を見分ける目印で、配列を並べるときは必須
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
        className={`py-1.5 text-xs underline underline-offset-2 ${predicted === 'unknown' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
      >
        {t.unknown}
      </button>

      {predicted && (
        <div className="flex flex-col items-center gap-3 mt-4">
          <p className="text-base font-bold text-white/80">{t.step2}</p>
          {picked && (
            <p className="text-xs text-white/50">
              {t.yourGuess}<span className="font-bold" style={{ color: picked.accentColor }}>{picked.typeName}</span>
            </p>
          )}
          {/* ローラーを「自分のみ」にしている人向け。チェックしたときだけ広い権限（activity:read_all）を求める。
              checked と onChange を state につなぐ「制御コンポーネント」: 画面の表示と state が常に一致する */}
          <label className="flex items-start gap-2 max-w-sm text-left text-xs text-white/60 cursor-pointer">
            <input
              type="checkbox"
              checked={includePrivate}
              onChange={(e) => setIncludePrivate(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#FC4C02]"
            />
            <span>
              {t.includePrivate}
              <span className="block text-white/40">{t.includePrivateNote}</span>
            </span>
          </label>
          <PeriodButtons lang={lang} predicted={predicted} includePrivate={includePrivate} />
        </div>
      )}
    </div>
  )
}
