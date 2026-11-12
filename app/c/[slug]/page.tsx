// キャラ別シェアページ: Xに貼られたときにキャラ画像付きのカードを表示させるための着地点

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCharacter, getVariant } from '@/lib/characters'
import { parseShareSlug } from '@/lib/share'

interface PageProps {
  params: { slug: string }
}

export function generateMetadata({ params }: PageProps): Metadata {
  const parsed = parseShareSlug(params.slug)
  if (!parsed) return {}
  const text = getVariant(parsed.characterId, parsed.sex)
  const title = `私のサイクリストタイプは「${text.name}」 — VeloAva`
  const description = 'Stravaのライドデータから、あなたのサイクリストタイプを6種類のキャラクターで診断します。'
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default function SharePage({ params }: PageProps) {
  const parsed = parseShareSlug(params.slug)
  if (!parsed) notFound()
  const character = getCharacter(parsed.characterId)
  const text = getVariant(parsed.characterId, parsed.sex)

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center px-6 py-16">
      <div className="max-w-sm w-full text-center">
        <p className="text-xs tracking-[0.3em] text-white/40 mb-6">VeloAva</p>
        <div className="relative rounded-3xl overflow-hidden mb-6">
          <div
            className="absolute inset-0 opacity-40"
            style={{ background: `radial-gradient(circle at 50% 60%, ${character.accentColor}, transparent 70%)` }}
          />
          <Image
            src={`/characters/${parsed.characterId}_${parsed.sex}.png`}
            alt={text.name}
            width={659}
            height={554}
            className="relative w-full h-auto"
            priority
          />
        </div>
        <p className="text-sm font-bold mb-1" style={{ color: character.accentColor }}>{text.title}</p>
        <h1 className="text-3xl font-black mb-3">{text.name}</h1>
        <p className="text-sm text-white/60 mb-10">{text.catchphrase}</p>

        <Link
          href="/"
          className="inline-block font-black px-8 py-4 rounded-2xl text-white transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: '#FC4C02', boxShadow: '0 4px 24px #FC4C0255' }}
        >
          あなたも診断する →
        </Link>
        <p className="mt-4 text-xs text-white/30">Stravaと連携して30秒で診断</p>
      </div>
    </main>
  )
}
