// キャラ別シェアページ（/c/{characterId}_{sex}）のURL組み立てと解析
// 呼び出し元: app/result/page.tsx（シェアURLを作る）、app/c/[slug]/page.tsx と opengraph-image.tsx（URLからキャラを特定する）
// fs などを使わない純粋な関数だけなので、サーバーでもブラウザでも動く

// `type Character` のように type を付けた import は型だけの読み込み。ビルド後の JS には残らない
import { getCharacter, getVariant, isCharacterId, type Character, type CharacterId, type CharacterVariant, type Sex } from './characters'

// interface は「このオブジェクトはこの形」という型の宣言。シェアページの表示に必要な値をひとまとめにしている
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
  // isCharacterId は型ガード。true の後ろでは id が CharacterId 型として扱われる（ただの string ではなくなる）
  if (!isCharacterId(id)) return null
  // URL は誰でも書き換えられるので、知らない値なら null を返して 404 にする
  if (sex !== 'male' && sex !== 'female') return null
  return { characterId: id, sex, character: getCharacter(id), variant: getVariant(id, sex) }
}
