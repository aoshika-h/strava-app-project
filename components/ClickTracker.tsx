'use client'
// data-ga-event を付けた要素のクリックをGA4に送る（サーバーコンポーネントのリンクにも onClick なしで付けられる）
// 例: <Link data-ga-event="ui_click" data-ga-id="privacy_link">

import { useEffect } from 'react'
import { gtagEvent } from '@/lib/gtag'

export default function ClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('[data-ga-event]')
      if (!el) return
      const { gaEvent, gaId } = el.dataset
      if (gaEvent) gtagEvent(gaEvent, gaId ? { button_id: gaId } : undefined)
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])
  return null
}
