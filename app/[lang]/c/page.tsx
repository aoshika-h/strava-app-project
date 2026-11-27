// キャラクター図鑑（/c、英語は /en/c）。6タイプ × 男女の12キャラを並べ、それぞれのキャラ紹介ページへリンクする
// 検索から来た人の入口と、キャラ紹介ページどうしをつなぐ役目（ページどうしのリンクがあると検索エンジンが全ページを見つけやすい）
// 文章はすべて lib/characters の定義から出していて、診断結果（Strava のデータ）は使わない
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { listCharacters, getVariant } from '@/lib/characters'
import { getDictionary, localePath, requireLocale, LOCALES } from '@/lib/i18n'
import { shareSlug } from '@/lib/share'
import { pageAlternates } from '@/lib/seo'

// 3言語ぶんをビルド時に作っておく（静的配信）
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = requireLocale(params.lang)
  const t = getDictionary(lang).typesIndex
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: pageAlternates(lang, '/c'),
  }
}

export default function TypesIndexPage({ params }: { params: { lang: string } }) {
  const lang = requireLocale(params.lang)
  const t = getDictionary(lang).typesIndex
  const characters = listCharacters(lang)

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <Link href={localePath(lang, '/')} data-ga-event="ui_click" data-ga-id="types_logo" className="inline-block py-1.5 text-xs tracking-[0.3em] text-white/55 hover:text-white">VeloAva</Link>
        <h1 className="text-3xl font-black mt-4 mb-2">{t.title}</h1>
        <p className="text-white/70 mb-10">{t.lead}</p>

        <div className="space-y-10">
          {characters.map((c) => (
            <section key={c.id}>
              <h2 className="text-lg font-bold mb-1" style={{ color: c.accentColor }}>{c.typeName}</h2>
              <p className="text-sm text-white/70 mb-4">{c.tagline}</p>
              <ul className="grid grid-cols-2 gap-3">
                {(['male', 'female'] as const).map((sex) => {
                  const v = getVariant(c.id, sex, lang)
                  return (
                    <li key={sex}>
                      <Link
                        href={localePath(lang, `/c/${shareSlug(c.id, sex)}`)}
                        data-ga-event="ui_click"
                        data-ga-id="types_card"
                        className="block p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <Image src={`/characters/${c.id}_${sex}.png`} alt={v.name} width={330} height={280} sizes="(min-width: 768px) 420px, 45vw" className="w-full h-auto rounded-xl" />
                        <span className="block mt-2 text-xs font-bold" style={{ color: c.accentColor }}>{v.title}</span>
                        <span className="block font-bold">{v.name}</span>
                        <span className="block mt-1 text-xs text-white/60">{v.catchphrase}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className="text-center mt-14">
          <Link
            href={localePath(lang, '/')}
            data-ga-event="ui_click"
            data-ga-id="types_cta"
            className="inline-block font-black px-8 py-4 rounded-2xl text-white"
            style={{ backgroundColor: '#FC4C02' }}
          >
            {t.cta}
          </Link>
        </div>
      </div>
    </main>
  )
}
