// サイトマップ（/sitemap.xml）。Next.js の決まりで app/sitemap.ts が自動で XML になる
// 載せるのは検索に出てほしい公開ページだけ: トップ、プライバシー、キャラ紹介ページ（6タイプ×男女）。
// 結果ページ（/result?data=...）は個人の診断結果なので載せない（ページ側でも noindex にしている）。
// 各ページは日本語（言語なし）・英語（/en）・ポルトガル語（/pt）の3つを、互いの別言語版として登録する（hreflang）
// middleware.ts は拡張子付きのパスを対象外にしているので、/sitemap.xml は言語の振り分けを通らない

import type { MetadataRoute } from 'next'
import { CHARACTER_IDS } from '@/lib/characters/types'
import { LOCALES, localePath } from '@/lib/i18n/config'
import { shareSlug } from '@/lib/share'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://veloava.vercel.app'

// hreflang の言語コード。ポルトガル語はブラジル向けなので pt-BR（<html lang> と同じ）
const HREFLANG = { ja: 'ja', en: 'en', pt: 'pt-BR' } as const

function entries(path: string, priority: number): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LOCALES.map((l) => [HREFLANG[l], BASE_URL + localePath(l, path)]))
  return LOCALES.map((l) => ({
    url: BASE_URL + localePath(l, path),
    changeFrequency: 'weekly' as const,
    priority,
    alternates: { languages },
  }))
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...entries('/', 1),
    ...CHARACTER_IDS.flatMap((id) => (['male', 'female'] as const).flatMap((sex) => entries(`/c/${shareSlug(id, sex)}`, 0.6))),
    ...entries('/privacy', 0.2),
  ]
}
