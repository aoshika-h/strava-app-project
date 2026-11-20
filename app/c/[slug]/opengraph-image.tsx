// キャラ別OGP画像（Xのカードに出る 1200x630）。next/og(satori)で描画するため inline style のみ

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import type { CharacterVariant } from '@/lib/characters'
import { getSharePageData } from '@/lib/share'

export const alt = 'VeloAva サイクリストキャラクター診断'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const OG_TEXT = {
  lead: '私のサイクリストタイプは',
  cta: 'あなたは何タイプ？',
}

export default async function Image({ params }: { params: { slug: string } }) {
  const { characterId, sex, character, variant } = getSharePageData(params.slug) ?? getSharePageData('allrounder_male')!

  const [font, imageData] = await Promise.all([
    loadJapaneseFont(`VeloAva${OG_TEXT.lead}${OG_TEXT.cta}${variant.title}${variant.name}${variant.catchphrase}`),
    // キャラ画像は next.config.mjs の outputFileTracingIncludes で関数にバンドルしている
    readFile(join(process.cwd(), 'public', 'characters', `${characterId}_${sex}.png`)),
  ])

  return new ImageResponse(
    <OgImageLayout
      variant={variant}
      accentColor={character.accentColor}
      imageSrc={`data:image/png;base64,${imageData.toString('base64')}`}
    />,
    {
      ...size,
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

function OgImageLayout({
  variant,
  accentColor,
  imageSrc,
}: {
  variant: CharacterVariant
  accentColor: string
  imageSrc: string
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: 'linear-gradient(135deg, #0A0A0F 0%, #12122a 100%)',
        fontFamily: 'NotoSansJP',
        color: '#fff',
      }}
    >
      <div style={{ width: 640, height: 630, display: 'flex' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} width={640} height={630} style={{ objectFit: 'cover', objectPosition: 'top' }} alt="" />
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 56px 0 24px',
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 6, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>VeloAva</div>
        <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>{OG_TEXT.lead}</div>
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            fontSize: 24,
            color: accentColor,
            border: `2px solid ${accentColor}`,
            borderRadius: 999,
            padding: '4px 20px',
            marginBottom: 12,
          }}
        >
          {variant.title}
        </div>
        <div style={{ fontSize: 50, lineHeight: 1.2, marginBottom: 20 }}>{variant.name}</div>
        <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, marginBottom: 40 }}>
          {variant.catchphrase}
        </div>
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            fontSize: 30,
            background: accentColor,
            borderRadius: 16,
            padding: '12px 28px',
          }}
        >
          {OG_TEXT.cta}
        </div>
      </div>
    </div>
  )
}
