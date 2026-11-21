// キャラ別シェアページ: Xのカードから来た人を診断に誘導する着地点
// URL は /c/climber_male のような形。フォルダ名の [slug] は「動的セグメント」で、URL のその部分が params.slug に入る。
// 同じフォルダの opengraph-image.tsx が、このページの OGP 画像（Xのカードの画像）を自動で担当する。
// 出てくる概念: 動的ルート、params、generateMetadata、notFound()

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSharePageData } from '@/lib/share'

interface PageProps {
  params: { slug: string }
}

// generateMetadata はページごとに中身が変わる <title> や OGP を作るための関数（固定なら export const metadata でよい）。
// Xのボットはこの <meta> を読んでカードを作るので、キャラ名入りのタイトルにしている
export function generateMetadata({ params }: PageProps): Metadata {
  const data = getSharePageData(params.slug)
  if (!data) return {}
  const title = `私のサイクリストタイプは「${data.variant.name}」 — VeloAva`
  const description = 'Stravaのライドデータから、あなたのサイクリストタイプを6種類のキャラクターで診断します。'
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default function SharePage({ params }: PageProps) {
  const data = getSharePageData(params.slug)
  // notFound() を呼ぶとそこで処理が止まり、404 ページが表示される（/c/nope_male のような存在しないキャラ）
  if (!data) notFound()
  const { characterId, sex, character, variant } = data

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
          data-ga-event="share_page_cta"
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
