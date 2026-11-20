// キャラクター定義の読み出し窓口。アプリはここ経由でのみ参照する
// （保存先をDB等に移すときは、このファイルの実装だけを差し替える）

import { CHARACTER_DATA } from './data'
import { CHARACTER_IDS, type Character, type CharacterId, type CharacterVariant, type Sex } from './types'

export * from './types'

export function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === 'string' && (CHARACTER_IDS as readonly string[]).includes(value)
}

export function getCharacter(id: CharacterId): Character {
  return CHARACTER_DATA[id]
}

export function getVariant(id: CharacterId, sex: Sex): CharacterVariant {
  return CHARACTER_DATA[id].variants[sex]
}

export function listCharacters(): Character[] {
  return CHARACTER_IDS.map((id) => CHARACTER_DATA[id])
}
