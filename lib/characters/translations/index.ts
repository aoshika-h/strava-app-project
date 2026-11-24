// キャラクターの文章の翻訳（日本語は data.ts）。Partial なので、ある言語に翻訳がなければ日本語が出る
import type { CharacterId, CharacterText } from '../types'
import type { Locale } from '../../i18n/config'
import { en } from './en'
import { pt } from './pt'

export const CHARACTER_TRANSLATIONS: Partial<Record<Locale, Record<CharacterId, CharacterText>>> = { en, pt }
