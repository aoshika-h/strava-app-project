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

export function gtagEvent(eventName: string, params?: Record<string, string | number>) {
  if (typeof window === 'undefined' || !window.gtag || !GA_ID) return
  window.gtag('event', eventName, params)
}
