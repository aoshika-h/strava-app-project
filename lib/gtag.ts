// Google Analytics 4 イベント送信ユーティリティ

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? ''

// ユーザー単位のカスタムディメンション用。Strava由来の値は入れない（API Policy 5.4）
export function gtagSetUserProperties(properties: Record<string, string>) {
  if (typeof window === 'undefined' || !window.gtag || !GA_ID) return
  window.gtag('set', 'user_properties', properties)
}

// GA の client_id（「乱数.初回訪問時刻」）を取得する。Strava 認証でブラウザが変わっても同じ人として計測するため
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
