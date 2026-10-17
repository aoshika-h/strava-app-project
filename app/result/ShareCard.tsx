'use client'
// シェアカードコンポーネント
// キャラクター情報を1枚にまとめ、ダウンロード/共有ボタン付きで表示する
// このコンポーネントがページ最上部に配置され、ヒーローセクションを兼ねる

import { useRef, useState } from 'react'
import { getGenderText, type CharacterId, type CharacterType } from '@/lib/character'

interface Props {
  character: CharacterType
  characterId: CharacterId
  athleteName: string
  sex: 'male' | 'female'
  personalityComment?: string | null
}

export default function ShareCard({ character, characterId, athleteName, sex, personalityComment }: Props) {
  const imageSrc = `/characters/${characterId}_${sex}.png`
  const genderText = getGenderText(character, sex)
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const isMobileDevice = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0

  const handleSave = async () => {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0d0d18',
        scale: 2,         // 2倍解像度
        useCORS: true,
        logging: false,
      })

      const filename = `veloava-${characterId}.png`

      // タッチデバイス（SP/タブレット）: Web Share APIでネイティブ共有シートを表示
      const isMobile = navigator.maxTouchPoints > 0
      if (isMobile && navigator.share) {
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/png')
        )
        const file = new File([blob], filename, { type: 'image/png' })
        await navigator.share({ files: [file], title: 'VeloAva キャラクター診断' })
        return
      }

      // デスクトップ: PNGダウンロード
      const link = document.createElement('a')
      link.download = filename
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error('保存エラー:', e)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* ダウンロードボタン（カードの上に配置） */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: character.accentColor,
            color: '#fff',
            fontWeight: 900,
            fontSize: '15px',
            padding: '12px 28px',
            borderRadius: '14px',
            border: 'none',
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.6 : 1,
            boxShadow: `0 4px 24px ${character.accentColor}55`,
          }}
        >
          {saving ? '⏳ 処理中...' : isMobileDevice ? '📲 保存・シェア' : '💾 画像をダウンロード'}
        </button>
      </div>

      {/* ========== キャプチャ対象カード ========== */}
      {/* inline styleを使う: Tailwindクラスはhtml2canvasで取りこぼすため */}
      <div
        ref={cardRef}
        style={{
          width: '360px',
          maxWidth: '100%',
          margin: '0 auto',
          background: 'linear-gradient(160deg, #0d0d18 0%, #12122a 100%)',
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", sans-serif',
        }}
      >
        {/* 背景グロー */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 35%, ${character.accentColor}55 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />

        {/* ストライプ装飾 */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 24px)',
          pointerEvents: 'none',
        }} />

        {/* キャラクター画像 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={genderText.name}
          crossOrigin="anonymous"
          style={{ width: '100%', display: 'block', position: 'relative' }}
        />

        {/* テキストエリア */}
        <div style={{
          padding: '20px 24px 28px',
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* 肩書きバッジ */}
          <div style={{
            display: 'inline-block',
            fontSize: '10px',
            fontWeight: 900,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: character.accentColor,
            background: `${character.accentColor}20`,
            border: `1px solid ${character.accentColor}55`,
            borderRadius: '20px',
            padding: '4px 12px',
            marginBottom: '10px',
          }}>
            {genderText.title}
          </div>

          {/* キャラクター名 */}
          <div style={{
            fontSize: '30px',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.2,
            marginBottom: '10px',
          }}>
            {genderText.name}
          </div>

          {/* 必殺技 */}
          <div style={{
            fontSize: '13px',
            fontWeight: 900,
            color: character.accentColor,
            letterSpacing: '1px',
            marginBottom: '14px',
          }}>
            {genderText.specialMove}
          </div>

          {/* セリフ */}
          <div style={{
            fontSize: '13px',
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.75)',
            background: `${character.accentColor}18`,
            border: `1px solid ${character.accentColor}40`,
            borderRadius: '12px',
            padding: '12px 16px',
            lineHeight: 1.7,
            marginBottom: '18px',
          }}>
            {genderText.catchphrase}
          </div>

          {/* キャラクター説明 / AIコメント */}
          {personalityComment ? (
            <div style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.7,
              textAlign: 'left',
              background: `${character.accentColor}18`,
              border: `1px solid ${character.accentColor}40`,
              borderRadius: '10px',
              padding: '10px 12px',
              marginBottom: '14px',
            }}>
              ✨ {personalityComment}
            </div>
          ) : (
            <>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.7,
                textAlign: 'left',
                marginBottom: '10px',
              }}>
                {genderText.description}
              </div>
              <div style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.35)',
                lineHeight: 1.6,
                textAlign: 'left',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: '10px',
                marginBottom: '14px',
              }}>
                📖 {genderText.lore}
              </div>
            </>
          )}

          {/* フッター: VeloAvaロゴ */}
          <div style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}>
            VeloAva
          </div>
        </div>
      </div>
    </div>
  )
}
