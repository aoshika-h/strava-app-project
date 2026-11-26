// 検索エンジン向けの小物（canonical・別言語版・構造化データ）
// 呼び出し元: 各ページの generateMetadata（トップ・キャラ紹介・プライバシー）と、トップの構造化データ
// URL は相対パスで返す。layout.tsx の metadataBase が付いて絶対URLになる

import { LOCALES, localePath, type Locale } from './i18n/config'

// hreflang の言語コード。ポルトガル語はブラジル向けなので pt-BR（<html lang> と同じ）
export const HREFLANG: Record<Locale, string> = { ja: 'ja', en: 'en', 'pt': 'pt-BR' }

// あるページの canonical（そのページ自身）と、同じ内容の別言語版の一覧。
// path は言語なしのパス（'/'・'/privacy'・'/c/climber_male'）。
// x-default は言語が合わない人向けの既定で、英語版にする
export function pageAlternates(lang: Locale, path: string) {
  const languages: Record<string, string> = Object.fromEntries(LOCALES.map((l) => [HREFLANG[l], localePath(l, path)]))
  languages['x-default'] = localePath('en', path)
  return { canonical: localePath(lang, path), languages }
}
