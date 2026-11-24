// 対応言語の定義と、言語にまつわる小さな関数
// 呼び出し元: middleware.ts（言語の振り分け）、各ページ（params.lang の確認、リンク先の組み立て）、Strava 認証の state
// fs などを使わない純粋な関数だけなので、サーバー・ブラウザ・middleware（Edge）のどこでも動く

// 日本語はURLに言語を付けない（既存のURLをそのまま使うため）。英語・ポルトガル語は /en・/pt を付ける
export const LOCALES = ['ja', 'en', 'pt'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'ja'

// 言語切り替えで選んだ言語を覚えておく Cookie の名前（middleware が初回の振り分けに使う）
export const LOCALE_COOKIE = 'veloava_locale'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

// URL の先頭に付ける言語の部分。日本語は空文字（/result のまま）、英語は /en（/en/result）
export function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? '' : `/${locale}`
}

// アプリ内のパスを言語付きに変換する。localePath('en', '/') → '/en'、localePath('ja', '/result') → '/result'
export function localePath(locale: Locale, path: string): string {
  const prefix = localePrefix(locale)
  if (!prefix) return path
  return path === '/' ? prefix : `${prefix}${path}`
}

// ブラウザの Accept-Language（例: "pt-BR,pt;q=0.9,en;q=0.8"）から言語を選ぶ
// 日本語・ポルトガル語はそのまま、それ以外の言語（スペイン語など）は英語に寄せる。ヘッダーが無い（クローラーなど）なら日本語
export function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE
  // 各候補を「言語コードと優先度 q」に分け、q の高い順に並べて先頭を採用する
  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().toLowerCase().split(';')
      const q = params.find((p) => p.trim().startsWith('q='))
      return { lang: tag.split('-')[0], q: q ? parseFloat(q.split('=')[1]) || 0 : 1 }
    })
    .filter((x) => x.lang && x.lang !== '*')
    .sort((a, b) => b.q - a.q)
  const top = ranked[0]?.lang
  if (!top) return DEFAULT_LOCALE
  if (top === 'ja' || top === 'pt') return top
  return 'en'
}
