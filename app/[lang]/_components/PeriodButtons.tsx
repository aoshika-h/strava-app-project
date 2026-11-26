'use client'
// 期間ボタン（3ヶ月・6ヶ月・1年）と、押したあとのローディング画面
// トップページの DiagnosisStarter の中で使う。押すと GA に記録してから Strava の認証ページへ移動する。
// 学べること: props の型、useEffect の「後片付け」（return で戻す処理）、async の関数で完了を待つ、
// 状態によって画面の一部を出し分ける（loading && ...）

import { useState, useEffect } from 'react'
import { getGaClientId, gtagEvent, gtagSetUserProperties } from '@/lib/gtag'
import { savePrediction, type PredictedType } from '@/lib/prediction'
import { getDictionary, type Locale } from '@/lib/i18n'

// gaLabel は GA の diagnosis_start に送る値。言語が変わっても集計がばらけないよう、日本語の表記に固定している
const PERIODS = [
  { gaLabel: '3ヶ月', period: '90' },
  { gaLabel: '6ヶ月', period: '180' },
  { gaLabel: '1年', period: '365' },
]

// 引数の { lang, predicted, includePrivate } が props（親の DiagnosisStarter から渡される値）。: の後ろはその型
export default function PeriodButtons({ lang, predicted, includePrivate }: { lang: Locale; predicted: PredictedType; includePrivate: boolean }) {
  const t = getDictionary(lang)
  // 押された期間（'90' など）。null ならまだ押されていない。値が入るとローディング画面が出る
  const [loading, setLoading] = useState<string | null>(null)

  // ローディング中は背景のページをスクロールさせない。document はブラウザにしかないので useEffect の中で触る。
  // [loading] は「loading が変わったら実行し直す」という指定。return した関数は、次に実行し直す前と
  // 画面から消えるときに呼ばれる「後片付け」で、スクロールを元に戻している
  useEffect(() => {
    document.body.style.overflow = loading ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [loading])

  // async: 途中の await（GA の利用者IDの取得）が終わるのを待ってから、次の行へ進む関数
  const handleClick = async (period: string, label: string) => {
    if (loading) return // 二度押し防止
    gtagSetUserProperties({ predicted_type: predicted })
    gtagEvent('diagnosis_start', { period: label, predicted_type: predicted, include_private: includePrivate ? 'yes' : 'no' })
    savePrediction(predicted)
    setLoading(period)
    // Strava 認証でブラウザが切り替わっても同じ人として計測できるよう、GA の利用者IDを URL で持ち回る（最大0.5秒で諦める）
    const cid = await getGaClientId()
    // location.href への代入はページ移動。/api/auth/strava（サーバー）が Strava の許可画面へリダイレクトする
    // lang は結果ページを同じ言語で出すために OAuth の state に載せて持ち回る（日本語は省略）
    window.location.href = `/api/auth/strava?period=${period}${includePrivate ? '&private=1' : ''}${cid ? `&cid=${encodeURIComponent(cid)}` : ''}${lang !== 'ja' ? `&lang=${lang}` : ''}`
  }

  return (
    <>
      {/* 期間選択ボタン */}
      <div className="flex gap-3">
        {PERIODS.map(({ gaLabel, period }) => (
          <button
            key={period}
            onClick={() => handleClick(period, gaLabel)}
            disabled={!!loading}
            className="flex flex-col items-center gap-2 bg-white/5 hover:bg-[#FC4C02] border border-white/15 hover:border-[#FC4C02] text-white/70 hover:text-white font-bold px-6 py-4 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25 hover:-translate-y-0.5 disabled:cursor-wait disabled:hover:bg-white/5 disabled:hover:border-white/15 disabled:hover:-translate-y-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0 3 13.828h4.17" />
            </svg>
            <span className="text-base">{t.periods[period]}</span>
          </button>
        ))}
      </div>

      {/* ローディングモーダル。{条件 && (...)} は「条件が真のときだけ表示」という書き方 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13131f] border border-white/10 rounded-3xl px-10 py-10 flex flex-col items-center gap-6 text-center max-w-xs w-full mx-4 shadow-2xl">

            {/* Stravaロゴは改変・アニメーション禁止のため静止表示し、動きはロゴの外で出す */}
            <div className="flex flex-col items-center gap-4">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="#FC4C02">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0 3 13.828h4.17" />
              </svg>
              <div className="relative w-16 h-2.5">
                <div className="loading-shuttle absolute top-0 w-2.5 h-2.5 rounded-full bg-[#FC4C02]" />
              </div>
            </div>

            <div>
              <p className="text-white font-bold text-lg mb-1">{t.loading.title}</p>
              <p className="text-white/55 text-sm">{t.loading.body1}<br />{t.loading.body2}</p>
            </div>

            {/* 選択期間の表示 */}
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-2.5 text-sm">
              <span className="text-white/55">{t.loading.period}</span>
              <span className="text-white font-bold ml-1">
                {t.periods[loading]}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
