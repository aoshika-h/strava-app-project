// Google Analytics 4 イベント送信ユーティリティ
// 呼び出し元: トップの期間ボタン、結果ページのシェアボタン、components/ClickTracker.tsx など。ブラウザでだけ意味がある
// gtag 本体は app/layout.tsx で読み込む。ここは「読み込まれていれば送る」だけの薄い窓口

// declare global で、ブラウザの window に gtag という関数があることを TypeScript に教える（無いと window.gtag が型エラーになる）
// `?:` は「無いこともある」という意味
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

// NEXT_PUBLIC_ で始まる環境変数はビルド時にブラウザ用のコードへ埋め込まれる。未設定なら空文字にして送信しない
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? ''

// ユーザー単位のカスタムディメンション用。Strava由来の値は入れない（API Policy 5.4）
// Record<string, string> は「キーも値も文字列のオブジェクト」という型
export function gtagSetUserProperties(properties: Record<string, string>) {
  // サーバーでの描画中は window が無いので何もしない。GA が未設定・広告ブロック等で gtag が無いときも同じ
  if (typeof window === 'undefined' || !window.gtag || !GA_ID) return
  window.gtag('set', 'user_properties', properties)
}

// GA の client_id（「乱数.初回訪問時刻」）を取得する。Strava 認証でブラウザが変わっても同じ人として計測するため
// Promise を返す関数。呼ぶ側は await で結果を待てる。GA の応答が来なくても 0.5 秒で null を返し、診断を止めない
export function getGaClientId(timeoutMs = 500): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.gtag || !GA_ID) return resolve(null)
    const timer = setTimeout(() => resolve(null), timeoutMs)
    window.gtag('get', GA_ID, 'client_id', (id: unknown) => {
      clearTimeout(timer)
      resolve(typeof id === 'string' ? id : null)
    })
  })
}

export function gtagEvent(eventName: string, params?: Record<string, string | number>) {
  if (typeof window === 'undefined' || !window.gtag || !GA_ID) return
  window.gtag('event', eventName, params)
}
