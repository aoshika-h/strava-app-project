// キャラクター定義の読み出し窓口。アプリはここ経由でのみ参照する
// （保存先をDB等に移すときは、このファイルの実装だけを差し替える）
// 呼び出し元: 診断ロジック・一言コメント・各ページ。データを読むだけなのでサーバーでもブラウザでも動く
// `import ... from '@/lib/characters'` と書くと、フォルダの index.ts が読まれる

import { CHARACTER_DATA } from './data'
import { CHARACTER_IDS, type Character, type CharacterId, type CharacterVariant, type Sex } from './types'

// export * で types.ts の型と定数をそのまま外に出す。使う側は '@/lib/characters' だけを import すればよい
export * from './types'

// 戻り値の `value is CharacterId` は型ガード。true を返したとき、呼び出し側で value を CharacterId として扱える
// unknown は「何が来るか分からない」型。URL や localStorage など外から来た値を確かめるのに使う
export function isCharacterId(value: unknown): value is CharacterId {
  // CHARACTER_IDS は6つの決まった文字列の配列なので、ただの string を includes に渡せるよう readonly string[] として見なしている
  return typeof value === 'string' && (CHARACTER_IDS as readonly string[]).includes(value)
}

export function getCharacter(id: CharacterId): Character {
  return CHARACTER_DATA[id]
}

export function getVariant(id: CharacterId, sex: Sex): CharacterVariant {
  return CHARACTER_DATA[id].variants[sex]
}

// map は配列の各要素を変換した新しい配列を返す。ID の並び順どおりにキャラを並べる
export function listCharacters(): Character[] {
  return CHARACTER_IDS.map((id) => CHARACTER_DATA[id])
}
