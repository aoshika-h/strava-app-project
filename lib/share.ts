import { isCharacterId, type CharacterId, type Sex } from './characters'

export function shareSlug(characterId: CharacterId, sex: Sex): string {
  return `${characterId}_${sex}`
}

export function parseShareSlug(slug: string): { characterId: CharacterId; sex: Sex } | null {
  const [id, sex] = slug.split('_')
  if (!isCharacterId(id)) return null
  if (sex !== 'male' && sex !== 'female') return null
  return { characterId: id, sex }
}
