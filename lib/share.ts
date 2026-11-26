// キャラ別シェアページ（/c/{characterId}_{sex}）のURL組み立てと解析
// 呼び出し元: app/[lang]/result/page.tsx（シェアURLを作る）、app/[lang]/c/[slug]/page.tsx と opengraph-image.tsx（URLからキャラを特定する）
// fs などを使わない純粋な関数だけなので、サーバーでもブラウザでも動く

// `type Character` のように type を付けた import は型だけの読み込み。ビルド後の JS には残らない
import { getCharacter, getVariant, isCharacterId, type Character, type CharacterId, type CharacterVariant, type Sex } from './characters'
import type { Locale } from './i18n/config'

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

// locale はキャラ名などの表示言語（/en/c/... なら英語の名前）
export function getSharePageData(slug: string, locale: Locale = 'ja'): SharePageData | null {
  const parts = slug.split('_')
  // 「キャラID_性別」のちょうど2つだけを受け付ける（climber_female_x のような余計な部分付きは不正として 404）
  if (parts.length !== 2) return null
  const [id, sex] = parts
  // isCharacterId は型ガード。true の後ろでは id が CharacterId 型として扱われる（ただの string ではなくなる）
  if (!isCharacterId(id)) return null
  // URL は誰でも書き換えられるので、知らない値なら null を返して 404 にする
  if (sex !== 'male' && sex !== 'female') return null
  return { characterId: id, sex, character: getCharacter(id, locale), variant: getVariant(id, sex, locale) }
}
