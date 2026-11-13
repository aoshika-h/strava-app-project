// キャラ別シェア（/c/{characterId}_{sex}）のURL組み立て・解析とOGP画像生成

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { getCharacter, getVariant, isCharacterId, type Character, type CharacterId, type CharacterVariant, type Sex } from '@/models/characters'
import OgImageView, { OG_TEXT } from '@/views/share/OgImageView'

export interface SharePageData {
  characterId: CharacterId
  sex: Sex
  character: Character
  variant: CharacterVariant
}

export function shareSlug(characterId: CharacterId, sex: Sex): string {
  return `${characterId}_${sex}`
}

export function getSharePageData(slug: string): SharePageData | null {
  const [id, sex] = slug.split('_')
  if (!isCharacterId(id)) return null
  if (sex !== 'male' && sex !== 'female') return null
  return { characterId: id, sex, character: getCharacter(id), variant: getVariant(id, sex) }
}

export const OG_IMAGE_SIZE = { width: 1200, height: 630 }

export async function createShareOgImage(slug: string): Promise<ImageResponse> {
  const data = getSharePageData(slug) ?? getSharePageData('allrounder_male')!
  const { characterId, sex, character, variant } = data

  const [font, imageData] = await Promise.all([
    loadJapaneseFont(`VeloAva${OG_TEXT.lead}${OG_TEXT.cta}${variant.title}${variant.name}${variant.catchphrase}`),
    readFile(join(process.cwd(), 'public', 'characters', `${characterId}_${sex}.png`)),
  ])

  return new ImageResponse(
    OgImageView({
      variant,
      accentColor: character.accentColor,
      imageSrc: `data:image/png;base64,${imageData.toString('base64')}`,
    }),
    {
      ...OG_IMAGE_SIZE,
      fonts: font ? [{ name: 'NotoSansJP', data: font, weight: 900, style: 'normal' }] : undefined,
    },
  )
}

// satoriはwoff2非対応。UA無しでリクエストするとGoogle FontsはTTFを返す
async function loadJapaneseFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@900&text=${encodeURIComponent(text)}`)
    ).text()
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1]
    if (!url) return null
    return await (await fetch(url)).arrayBuffer()
  } catch {
    return null
  }
}
