'use client'
// シェアカードコンポーネント
// キャプチャ用カード（ユーザー名なし）とダウンロードボタンを管理する

import { useRef, useState } from 'react'
import type { CharacterId, CharacterType } from '@/lib/character'

interface Props {
  character: CharacterType
  characterId: CharacterId
}

export default function ShareCard({ character, characterId }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  // html2canvasでカード要素を画像化してダウンロード
  const handleSave = async () => {
    if (!cardRef.current) return
    setSaving(true)
    try {
      // html2canvasは動的importでSSRを回避する
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,  // 透過背景を維持
        scale: 2,               // 2倍解像度で高品質に
        useCORS: true,
        logging: false,
      })
      // canvasをPNG画像としてダウンロード
      const link = document.createElement('a')
      link.download = `veloava-${characterId}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('画像保存エラー:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* ========== キャプチャ対象カード ========== */}
      {/* inline styleを使う: Tailwindはhtml2canvasで取りこぼす場合があるため */}
      <div
        ref={cardRef}
        style={{
          width: '360px',
          background: 'linear-gradient(160deg, #0d0d18 0%, #12122a 100%)',
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          margin: '0 auto',
        }}
      >
        {/* 背景グロー */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, ${character.accentColor}55 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />

        {/* キャラクター画像（full width） */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/characters/${characterId}.png`}
          alt={character.name}
          style={{ width: '100%', display: 'block', position: 'relative' }}
          crossOrigin="anonymous"
        />

        {/* テキストエリア */}
        <div style={{
          padding: '20px 24px 24px',
          textAlign: 'center',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}>
          {/* 肩書き */}
          <div style={{
            fontSize: '11px',
            fontWeight: 900,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: character.accentColor,
            marginBottom: '6px',
          }}>
            {character.title}
          </div>

          {/* キャラクター名 */}
          <div style={{
            fontSize: '28px',
            fontWeight: 900,
            color: '#ffffff',
            marginBottom: '10px',
            lineHeight: 1.2,
          }}>
            {character.name}
          </div>

          {/* 必殺技 */}
          <div style={{
            fontSize: '13px',
            fontWeight: 900,
            color: character.accentColor,
            letterSpacing: '1px',
            marginBottom: '12px',
          }}>
            {character.specialMove}
          </div>

          {/* セリフ */}
          <div style={{
            fontSize: '13px',
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.7)',
            background: `${character.accentColor}18`,
            border: `1px solid ${character.accentColor}40`,
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '16px',
            lineHeight: 1.6,
          }}>
            {character.catchphrase}
          </div>

          {/* VeloAvaブランディング */}
          <div style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '2px',
          }}>
            VeloAva
          </div>
        </div>
      </div>

      {/* ========== 保存ボタン ========== */}
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-50"
          style={{
            backgroundColor: character.accentColor,
            color: '#fff',
            fontSize: '15px',
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? '⏳ 保存中...' : '💾 画像を保存'}
        </button>
      </div>
    </div>
  )
}
