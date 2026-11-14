import { createShareOgImage, OG_IMAGE_SIZE } from '@/controllers/shareController'

export const alt = 'VeloAva サイクリストキャラクター診断'
export const size = OG_IMAGE_SIZE
export const contentType = 'image/png'

export default function Image({ params }: { params: { slug: string } }) {
  return createShareOgImage(params.slug)
}
