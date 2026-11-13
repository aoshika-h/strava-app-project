// キャラ別シェアページ: Xのカードから来た人を診断に誘導する着地点

import Link from 'next/link'
import Image from 'next/image'
import type { SharePageData } from '@/controllers/shareController'

export default function SharePageView({ characterId, sex, character, variant }: SharePageData) {
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
