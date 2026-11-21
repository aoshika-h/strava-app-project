// キャラクターの型定義。データ（data.ts）と読み出し窓口（index.ts）の両方から使う
// as const を付けると、中身が 'climber' などの決まった文字列のまま固定される（付けないと単なる string[] になる）
export const CHARACTER_IDS = ['climber', 'sprinter', 'tt', 'granfondo', 'allrounder', 'weekend'] as const

// 配列の要素の型を取り出す書き方。結果は 'climber' | 'sprinter' | ... | 'weekend' というユニオン型になる
// キャラを増やすときは CHARACTER_IDS に足すだけで、この型も自動で増える
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
  // Record<Sex, CharacterVariant> は { male: CharacterVariant; female: CharacterVariant } と同じ意味。両方そろっていないと型エラーになる
  variants: Record<Sex, CharacterVariant>
}
