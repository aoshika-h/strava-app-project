// 言語ごとの一言コメントの文章を返す窓口
import type { Locale } from '../i18n/config'
import type { InsightMessages } from './types'
import { ja } from './ja'
import { en } from './en'
import { pt } from './pt'

export type { InsightMessages }

const MESSAGES: Record<Locale, InsightMessages> = { ja, en, pt }

export function getInsightMessages(locale: Locale): InsightMessages {
  return MESSAGES[locale]
}
