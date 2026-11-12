import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { CHARACTERS, getGenderText } from '@/lib/character'
import { parseShareSlug } from '@/lib/share'

export const alt = 'VeloAva サイクリストキャラクター診断'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

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

export default async function Image({ params }: { params: { slug: string } }) {
  const parsed = parseShareSlug(params.slug) ?? { characterId: 'allrounder' as const, sex: 'male' as const }
  const character = CHARACTERS[parsed.characterId]
  const text = getGenderText(character, parsed.sex)
  const accent = character.accentColor

  const lines = {
    lead: '私のサイクリストタイプは',
    cta: 'あなたは何タイプ？',
  }
  const [font, imageData] = await Promise.all([
    loadJapaneseFont(`VeloAva${lines.lead}${lines.cta}${text.title}${text.name}${text.catchphrase}`),
    readFile(join(process.cwd(), 'public', 'characters', `${parsed.characterId}_${parsed.sex}.png`)),
  ])
  const imageSrc = `data:image/png;base64,${imageData.toString('base64')}`

  return new ImageResponse(
    (
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
        {/* キャラクター画像 */}
        <div style={{ width: 640, height: 630, display: 'flex' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            width={640}
            height={630}
            style={{ objectFit: 'cover', objectPosition: 'top' }}
            alt=""
          />
        </div>

        {/* テキスト */}
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
          <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>{lines.lead}</div>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              fontSize: 24,
              color: accent,
              border: `2px solid ${accent}`,
              borderRadius: 999,
              padding: '4px 20px',
              marginBottom: 12,
            }}
          >
            {text.title}
          </div>
          <div style={{ fontSize: 50, lineHeight: 1.2, marginBottom: 20 }}>{text.name}</div>
          <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, marginBottom: 40 }}>
            {text.catchphrase}
          </div>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              fontSize: 30,
              background: accent,
              borderRadius: 16,
              padding: '12px 28px',
            }}
          >
            {lines.cta}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: 'NotoSansJP', data: font, weight: 900, style: 'normal' }] : undefined,
    },
  )
}
