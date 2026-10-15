'use client'
// キャラクターイラストコンポーネント
// public/characters/ の実画像を表示する

import Image from 'next/image'
import type { CharacterId } from '@/lib/character'

export default function CharacterIllustration({
  characterId,
  accentColor,
}: {
  characterId: CharacterId
  accentColor: string
}) {
  return (
    <div className="relative w-full h-full">
      {/* キャラクター画像の背景グロー */}
      <div
        className="absolute inset-0 rounded-2xl blur-2xl opacity-30 scale-75"
        style={{ backgroundColor: accentColor }}
      />
      {/* キャラクター画像 */}
      <Image
        src={`/characters/${characterId}.png`}
        alt={characterId}
        fill
        className="object-contain drop-shadow-2xl relative"
        priority
      />
    </div>
  )
}
