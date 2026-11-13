// キャラ別OGP画像（1200x630）のレイアウト。next/og(satori)で描画するためinline styleのみ

import type { CharacterVariant } from '@/models/characters'

export const OG_TEXT = {
  lead: '私のサイクリストタイプは',
  cta: 'あなたは何タイプ？',
}

export default function OgImageView({
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
