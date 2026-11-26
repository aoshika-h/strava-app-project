// 言語ごとの辞書を返す窓口。辞書は小さいので、全言語分をそのまま読み込んでいる（ブラウザ側でも同期的に使える）
// 呼び出し元: 各ページ（サーバー）と 'use client' の部品（ブラウザ）

import { ja, type Dictionary } from './dictionaries/ja'
import { en } from './dictionaries/en'
import { pt } from './dictionaries/pt'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from './config'

export * from './config'
export type { Dictionary }

const DICTIONARIES: Record<Locale, Dictionary> = { ja, en, pt }

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}

// ページ（サーバー）の params.lang を確かめて Locale にする。知らない言語なら 404。
// middleware は拡張子付き（ドットを含む）パスを書き換えないので、/x.y/privacy のように任意の文字列が params.lang に来ることがある。
// layout でも 404 にしているが、ページ本体と generateMetadata は layout と並行して動くので、それぞれで確かめる
export function requireLocale(lang: string): Locale {
  if (!isLocale(lang)) notFound()
  return lang
}
