// キャラ別OGP画像（Xのカードに出る 1200x630）。next/og(satori)で描画するため inline style のみ
// Next.js の決まりで、この名前のファイルを置くと同じフォルダのページの OGP 画像になり、
// <meta property="og:image"> も自動で付く（URL は /c/climber_male/opengraph-image、英語は /en/c/climber_male/opengraph-image）。
// JSX を HTML ではなく PNG 画像に変換している。satori は CSS の一部しか対応せず、Tailwind も使えない。
// 出てくる概念: ファイル規約、async 関数、Promise.all、サーバー専用の node:fs

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import type { CharacterVariant } from '@/lib/characters'
import { getSharePageData } from '@/lib/share'
import { getDictionary, isLocale } from '@/lib/i18n'

// alt / size / contentType を export すると、Next.js が og:image の付属情報（説明・サイズ・形式）として使う
// alt は言語で変えられない（固定の値しか export できない）ため、言語に関係ない英語の表記にしている
export const alt = 'VeloAva — Cyclist character diagnosis'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// async 関数: 中で await を使って、画像ファイルの読み込みや通信の完了を待てる。戻り値は Promise になる
export default async function Image({ params }: { params: { slug: string; lang: string } }) {
  const lang = isLocale(params.lang) ? params.lang : 'ja'
  const og = getDictionary(lang).og // 「私のサイクリストタイプは」「あなたは何タイプ？」の各言語版
  // ?? は「左が null / undefined のときだけ右を使う」。存在しないキャラでも画像は返すため既定のキャラに倒している。
  // 末尾の ! は「ここは null にならない」と TypeScript に伝える印（実行時には何もしない）
  const { characterId, sex, character, variant } = getSharePageData(params.slug, lang) ?? getSharePageData('allrounder_male', lang)!

  // Promise.all は複数の待ち処理を同時に始めて、全部終わるのを待つ。順番に await するより速い
  const [font, imageData] = await Promise.all([
    // 英語・ポルトガル語でも同じフォントで描く（Noto Sans JP はアルファベットやアクセント付き文字 ã ç é も含む）
    loadJapaneseFont(`VeloAva${og.lead}${og.cta}${variant.title}${variant.name}${variant.catchphrase}`),
    // キャラ画像は next.config.mjs の outputFileTracingIncludes で関数にバンドルしている
    readFile(join(process.cwd(), 'public', 'characters', `${characterId}_${sex}.png`)),
  ])

  return new ImageResponse(
    <OgImageLayout
      text={og}
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
// 日本語フォントは全文字だと数MBあるので、画像に使う文字だけ（text= で指定）を Google Fonts から取り寄せる。
// 失敗しても画像生成は止めず null を返す（その場合は文字が表示されないだけ）
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

// 画像のレイアウト。見た目は普通の JSX だが、satori は display: flex の指定が必要など制約がある
function OgImageLayout({
  text,
  variant,
  accentColor,
  imageSrc,
}: {
  text: { lead: string; cta: string }
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
        <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>{text.lead}</div>
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
          {text.cta}
        </div>
      </div>
    </div>
  )
}
