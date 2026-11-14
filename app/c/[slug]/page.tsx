import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSharePageData } from '@/controllers/shareController'
import SharePageView from '@/views/share/SharePageView'

interface PageProps {
  params: { slug: string }
}

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
  if (!data) notFound()
  return <SharePageView {...data} />
}
