'use client'

import { useState } from 'react'
import { gtagEvent } from '@/lib/gtag'

const PERIODS = [
  { label: '3ヶ月', period: '90' },
  { label: '6ヶ月', period: '180' },
  { label: '1年',   period: '365' },
]

export default function PeriodButtons() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleClick = (period: string, label: string) => {
    if (loading) return
    gtagEvent('diagnosis_start', { period: label })
    setLoading(period)
    window.location.href = `/api/auth/strava?period=${period}`
  }

  return (
    <>
      {/* 期間選択ボタン */}
      <div className="flex gap-3">
        {PERIODS.map(({ label, period }) => (
          <button
            key={period}
            onClick={() => handleClick(period, label)}
            disabled={!!loading}
            className="flex flex-col items-center gap-2 bg-white/5 hover:bg-[#FC4C02] border border-white/15 hover:border-[#FC4C02] text-white/70 hover:text-white font-bold px-6 py-4 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25 hover:-translate-y-0.5 group disabled:opacity-50 disabled:cursor-wait disabled:hover:bg-white/5 disabled:hover:border-white/15 disabled:hover:-translate-y-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="opacity-60 group-hover:opacity-100">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0 3 13.828h4.17" />
            </svg>
            <span className="text-base">{label}</span>
          </button>
        ))}
      </div>

      {/* ローディングモーダル */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13131f] border border-white/10 rounded-3xl px-10 py-10 flex flex-col items-center gap-6 text-center max-w-xs w-full mx-4 shadow-2xl">

            {/* Stravaアイコン + スピナー */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FC4C0220', border: '1px solid #FC4C0240' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#FC4C02">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0 3 13.828h4.17" />
                </svg>
              </div>
              {/* スピナーリング */}
              <div className="absolute -inset-1.5 rounded-full border-2 border-t-[#FC4C02] border-r-[#FC4C02]/30 border-b-transparent border-l-transparent animate-spin" />
            </div>

            <div>
              <p className="text-white font-bold text-lg mb-1">Stravaに接続中</p>
              <p className="text-white/40 text-sm">認証ページに移動します<br />そのままお待ちください</p>
            </div>

            {/* 選択期間の表示 */}
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-2.5 text-sm">
              <span className="text-white/40">分析期間：</span>
              <span className="text-white font-bold ml-1">
                {PERIODS.find((p) => p.period === loading)?.label}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
