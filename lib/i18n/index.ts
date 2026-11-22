// 言語ごとの辞書を返す窓口。辞書は小さいので、全言語分をそのまま読み込んでいる（ブラウザ側でも同期的に使える）
// 呼び出し元: 各ページ（サーバー）と 'use client' の部品（ブラウザ）

import { ja, type Dictionary } from './dictionaries/ja'
import { en } from './dictionaries/en'
import { pt } from './dictionaries/pt'
import type { Locale } from './config'

export * from './config'
export type { Dictionary }

const DICTIONARIES: Record<Locale, Dictionary> = { ja, en, pt }

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}
