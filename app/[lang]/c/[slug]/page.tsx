// キャラ別シェアページ: Xのカードから来た人を診断に誘導する着地点で、検索から来た人向けのキャラ紹介ページも兼ねる
// URL は /c/climber_male（英語は /en/c/climber_male）のような形。フォルダ名の [slug]・[lang] は「動的セグメント」で、URL のその部分が params.slug・params.lang に入る。
// 同じフォルダの opengraph-image.tsx が、このページの OGP 画像（Xのカードの画像）を自動で担当する。
// 上半分（キャラ画像・名前・診断ボタン）はシェアから来た人向けでこれまでと同じ。下半分にタイプの特徴・ストーリー・ほかのキャラへのリンクを置き、
// 検索エンジンにページの中身を伝える（中身が薄いと検索に出にくいため）。文章はすべて lib/characters の定義から出していて、診断結果（Strava のデータ）は使わない
// 出てくる概念: 動的ルート、params、generateMetadata、notFound()

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSharePageData, shareSlug } from '@/lib/share'
import { CHARACTER_IDS } from '@/lib/characters/types'
import { getCharacter, getVariant } from '@/lib/characters'
import { getDictionary, localePath, requireLocale } from '@/lib/i18n'
import { pageAlternates } from '@/lib/seo'

interface PageProps {
  params: { slug: string; lang: string }
}

// generateMetadata はページごとに中身が変わる <title> や OGP を作るための関数（固定なら export const metadata でよい）。
// <title>（検索結果に出る）はキャラとタイプの説明にし、Xのカード（og:title）はシェアした人の言葉「私のサイクリストタイプは〜」のままにする
export function generateMetadata({ params }: PageProps): Metadata {
  const lang = requireLocale(params.lang)
  const t = getDictionary(lang).sharePage
  const data = getSharePageData(params.slug, lang)
  if (!data) return {}
  const shareTitle = t.metaTitle(data.variant.name)
  const description = t.metaDescription
  return {
    title: t.seoTitle(data.variant.name, data.variant.title, data.character.typeName),
    // 検索結果の説明文はキャラの説明から（長すぎる分は検索エンジンが省略する）
    description: data.variant.description,
    // canonical はUTMなどを付けない正規のURL（シェアURLのクエリ違いを同じページとして扱ってもらう）
    alternates: pageAlternates(lang, `/c/${shareSlug(data.characterId, data.sex)}`),
    openGraph: { title: shareTitle, description, type: 'website' },
    twitter: { card: 'summary_large_image', title: shareTitle, description },
  }
}

export default function SharePage({ params }: PageProps) {
  const lang = requireLocale(params.lang)
  const dict = getDictionary(lang)
  const t = dict.sharePage
  const data = getSharePageData(params.slug, lang)
  // notFound() を呼ぶとそこで処理が止まり、404 ページが表示される（/c/nope_male のような存在しないキャラ）
  if (!data) notFound()
  const { characterId, sex, character, variant } = data
  const otherSex = sex === 'male' ? 'female' : 'male'
  const otherVariant = getVariant(characterId, otherSex, lang)
  const otherTypes = CHARACTER_IDS.filter((id) => id !== characterId)

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white px-6 py-16">
      {/* ここから上半分: シェアから来た人向け（これまでと同じ） */}
      <div className="max-w-sm mx-auto text-center">
        <p className="text-xs tracking-[0.3em] text-white/55 mb-6">VeloAva</p>
        <div className="relative rounded-3xl overflow-hidden mb-6">
          <div
            className="absolute inset-0 opacity-40"
            style={{ background: `radial-gradient(circle at 50% 60%, ${character.accentColor}, transparent 70%)` }}
          />
          <Image
            src={`/characters/${characterId}_${sex}.png`}
            alt={variant.name}
            width={659}
            height={554}
            className="relative w-full h-auto"
            priority
          />
        </div>
        <p className="text-sm font-bold mb-1" style={{ color: character.accentColor }}>{variant.title}</p>
        <h1 className="text-3xl font-black mb-3">{variant.name}</h1>
        <p className="text-sm text-white/60 mb-10">{variant.catchphrase}</p>

        <Link
          data-ga-event="share_page_cta"
          href={localePath(lang, '/')}
          className="inline-block font-black px-8 py-4 rounded-2xl text-white transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: '#FC4C02', boxShadow: '0 4px 24px #FC4C0255' }}
        >
          {t.cta}
        </Link>
        <p className="mt-4 text-xs text-white/55">{t.note}</p>
      </div>

      {/* ここから下半分: タイプの紹介（検索から来た人・もっと知りたい人向け） */}
      <div className="max-w-xl mx-auto mt-20 space-y-10 text-left">
        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: character.accentColor }}>{t.featuresTitle(character.typeName)}</h2>
          <p className="text-white/80 leading-relaxed">{variant.description}</p>
          <p className="mt-3 text-sm font-bold text-white/70">{variant.specialMove}</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-white/80">{t.strengthsTitle}</h2>
          <ul className="flex flex-wrap gap-2">
            {character.strengths.map((s) => (
              <li key={s} className="text-sm px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80">{s}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3 text-white/80">{t.loreTitle}</h2>
          <p className="text-white/70 leading-relaxed">{variant.lore}</p>
        </section>

        {/* 同じタイプの、もう一方の性別のキャラ */}
        <section>
          <h2 className="text-base font-bold mb-3 text-white/80">{t.otherVariantTitle(t.sexLabel[otherSex])}</h2>
          <Link
            href={localePath(lang, `/c/${shareSlug(characterId, otherSex)}`)}
            data-ga-event="ui_click"
            data-ga-id="c_other_variant"
            className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <Image src={`/characters/${characterId}_${otherSex}.png`} alt="" width={96} height={81} className="rounded-xl" />
            <span>
              <span className="block text-xs font-bold" style={{ color: character.accentColor }}>{otherVariant.title}</span>
              <span className="block font-bold">{otherVariant.name}</span>
            </span>
          </Link>
        </section>

        {/* ほかの5タイプ（同じ性別） */}
        <section>
          <h2 className="text-base font-bold mb-3 text-white/80">{t.otherTypesTitle}</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {otherTypes.map((id) => {
              const c = getCharacter(id, lang)
              const v = getVariant(id, sex, lang)
              return (
                <li key={id}>
                  <Link
                    href={localePath(lang, `/c/${shareSlug(id, sex)}`)}
                    data-ga-event="ui_click"
                    data-ga-id="c_other_type"
                    className="block p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-center"
                  >
                    <Image src={`/characters/${id}_${sex}.png`} alt="" width={120} height={101} className="mx-auto rounded-xl" />
                    <span className="block mt-2 text-xs font-bold" style={{ color: c.accentColor }}>{c.typeName}</span>
                    <span className="block text-sm font-bold">{v.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <Link href={localePath(lang, '/c')} data-ga-event="ui_click" data-ga-id="c_index_link" className="inline-block mt-4 py-1.5 text-sm text-white/70 underline underline-offset-2 hover:text-white">
            {t.indexLink}
          </Link>
        </section>

        {/* 連携をためらう人向けの安心材料（トップと同じ文言） */}
        <section>
          <h2 className="text-base font-bold mb-3 text-white/80">{t.trustTitle}</h2>
          <ul className="space-y-2 text-sm text-white/70">
            {dict.home.trust.map((text) => (
              <li key={text} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">{text}</li>
            ))}
          </ul>
        </section>

        <div className="text-center pt-4">
          <Link
            data-ga-event="share_page_cta"
            data-ga-id="bottom"
            href={localePath(lang, '/')}
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
