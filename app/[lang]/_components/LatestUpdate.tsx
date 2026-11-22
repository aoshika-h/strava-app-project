'use client'
// 最新の更新のお知らせ。「もう一度診断」が意味を持つ、以前に診断したことがある人にだけ、公開から14日間出す
// トップページのファーストビュー（タイトルの上）で使う。
// 学べること: ブラウザにしかない値（localStorage）を useEffect で読む理由（hydration エラーを避ける）、
// 何も表示しないときは null を返す

import { useEffect, useState } from 'react'
import { getChangelog, isRecent } from '@/lib/changelog'
import { getDictionary, type Locale } from '@/lib/i18n'
import { hasDiagnosedBefore } from '@/lib/result-history'

export default function LatestUpdate({ lang }: { lang: Locale }) {
  // その言語に訳がある更新の先頭。訳がまだない言語では、古い更新が出ないよう latest が無ければ表示しない
  const latest = getChangelog(lang)[0]
  // 最初は必ず false にしておく。サーバーには localStorage がないので、サーバーとブラウザの最初の描画を
  // 「表示なし」でそろえ（hydration エラーを防ぐ）、表示後に useEffect の中でブラウザだけが判定して切り替える
  const [show, setShow] = useState(false)
  useEffect(() => setShow(!!latest && isRecent(latest) && hasDiagnosedBefore()), [latest])
  if (!show || !latest) return null // コンポーネントが null を返すと、何も描画されない

  return (
    <a
      href="#changelog"
      data-ga-event="ui_click"
      data-ga-id="latest_update"
      className="flex items-center gap-2 max-w-xl mx-auto mb-6 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-2.5 text-left text-xs text-white/75 hover:bg-orange-500/15 transition-colors"
    >
      <span className="flex-shrink-0 font-black text-orange-400">NEW {getDictionary(lang).formatShortDate(latest.date)}</span>
      <span className="leading-relaxed line-clamp-2">{latest.headline ?? latest.text}</span>
    </a>
  )
}
