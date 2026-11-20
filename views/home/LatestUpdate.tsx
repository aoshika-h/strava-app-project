'use client'
// 最新の更新のお知らせ。「もう一度診断」が意味を持つ、以前に診断したことがある人にだけ、公開から14日間出す

import { useEffect, useState } from 'react'
import { CHANGELOG, formatChangelogDate, isRecent } from '@/models/changelog'
import { hasDiagnosedBefore } from '@/models/resultHistory'

export default function LatestUpdate() {
  const latest = CHANGELOG[0]
  const [show, setShow] = useState(false)
  useEffect(() => setShow(isRecent(latest) && hasDiagnosedBefore()), [latest])
  if (!show) return null

  return (
    <a
      href="#changelog"
      data-ga-event="ui_click"
      data-ga-id="latest_update"
      className="flex items-center gap-2 max-w-xl mx-auto mb-6 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-2.5 text-left text-xs text-white/75 hover:bg-orange-500/15 transition-colors"
    >
      <span className="flex-shrink-0 font-black text-orange-400">NEW {formatChangelogDate(latest.date)}</span>
      <span className="leading-relaxed line-clamp-2">{latest.headline ?? latest.text}</span>
    </a>
  )
}
