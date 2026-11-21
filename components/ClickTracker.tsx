'use client'
// data-ga-event を付けた要素のクリックをGA4に送る（サーバーコンポーネントのリンクにも onClick なしで付けられる）
// 例: <Link data-ga-event="ui_click" data-ga-id="privacy_link">
// 'use client' はブラウザで動く部品の印。クリックの監視はブラウザでしかできないため必要。
// app/layout.tsx に置いていて、全ページで1つだけ動く。画面には何も描かない（return null）。
// 出てくる概念: useEffect と後片付け、イベントの委任（delegation）、data-* 属性、optional chaining（?.）

import { useEffect } from 'react'
import { gtagEvent } from '@/lib/gtag'

export default function ClickTracker() {
  // useEffect は「画面を描いたあとに1回実行する」処理（第2引数の [] が空なので最初の1回だけ）。
  // document はブラウザにしかないので、描画中ではなくここで触る
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // イベントの委任: リンク1つずつに onClick を付けず、document 全体で受けてから「押された要素（またはその親）に
      // data-ga-event があるか」を closest で探す。?. は左が null なら以降を実行せず undefined にする書き方
      const el = (e.target as Element | null)?.closest<HTMLElement>('[data-ga-event]')
      if (!el) return
      // data-ga-event="..." / data-ga-id="..." は dataset.gaEvent / dataset.gaId として読める（ハイフンがキャメルケースになる）
      const { gaEvent, gaId } = el.dataset
      if (gaEvent) gtagEvent(gaEvent, gaId ? { button_id: gaId } : undefined)
    }
    // capture: true で、リンクのページ移動より先にクリックを受け取る（移動で計測が取りこぼされないように）
    document.addEventListener('click', onClick, { capture: true })
    // useEffect が返す関数は「後片付け」。部品が画面から消えるときに実行され、監視を外す
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])
  return null
}
