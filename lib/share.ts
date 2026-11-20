// キャラ別シェアページ（/c/{characterId}_{sex}）のURL組み立てと解析

import { getCharacter, getVariant, isCharacterId, type Character, type CharacterId, type CharacterVariant, type Sex } from './characters'

export interface SharePageData {
  characterId: CharacterId
  sex: Sex
  character: Character
  variant: CharacterVariant
}

export function shareSlug(characterId: CharacterId, sex: Sex): string {
  return `${characterId}_${sex}`
}

export function getSharePageData(slug: string): SharePageData | null {
  const [id, sex] = slug.split('_')
  if (!isCharacterId(id)) return null
  if (sex !== 'male' && sex !== 'female') return null
  return { characterId: id, sex, character: getCharacter(id), variant: getVariant(id, sex) }
}
