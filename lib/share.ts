import type { CharacterId } from './character'

const CHARACTER_IDS: CharacterId[] = ['climber', 'sprinter', 'tt', 'granfondo', 'allrounder', 'weekend']

export type Sex = 'male' | 'female'

export function shareSlug(characterId: CharacterId, sex: Sex): string {
  return `${characterId}_${sex}`
}

export function parseShareSlug(slug: string): { characterId: CharacterId; sex: Sex } | null {
  const [id, sex] = slug.split('_')
  if (!CHARACTER_IDS.includes(id as CharacterId)) return null
  if (sex !== 'male' && sex !== 'female') return null
  return { characterId: id as CharacterId, sex }
}
