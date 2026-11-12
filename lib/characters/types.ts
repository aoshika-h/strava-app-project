export const CHARACTER_IDS = ['climber', 'sprinter', 'tt', 'granfondo', 'allrounder', 'weekend'] as const

export type CharacterId = (typeof CHARACTER_IDS)[number]

export type Sex = 'male' | 'female'

// 性別ごとに異なる表示テキスト
export interface CharacterVariant {
  name: string
  title: string          // 肩書き
  catchphrase: string    // セリフ
  specialMove: string    // 必殺技名
  description: string
  lore: string           // 背景ストーリー
}

// 性別によらない共通属性
export interface Character {
  id: CharacterId
  typeName: string       // タイプ名（例: クライマー）
  tagline: string        // タイプの一言説明（例: 山岳の覇者）
  emoji: string
  accentColor: string
  strengths: string[]
  tips: string[]
  variants: Record<Sex, CharacterVariant>
}
