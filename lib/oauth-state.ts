// Strava OAuth の state に載せる値（分析期間・GA の client_id・表示言語）の組み立てと解析
// state は「期間:client_id:言語」（例 180:123.456:pt。client_id がなければ 180::pt、日本語なら言語を省いて 180:123.456 / 180）
// state は認証の前後で Strava がそのまま返してくれる文字列。サーバーにセッションを持たないので、ここに必要な情報を載せて持ち回る
// 呼び出し元: app/api/auth/strava/route.ts（buildState）と app/api/auth/callback/route.ts（parseState）。サーバーでだけ動く

import { DEFAULT_LOCALE, isLocale, type Locale } from './i18n/config'

const VALID_PERIODS = ['90', '180', '365']
// GA の client_id（例 123456789.1700000000）。Strava 認証の前後でブラウザが変わっても同じ人として計測するために持ち回る
// 正規表現: ^ と $ で全体一致、\d{1,20} は数字1〜20桁、\. はドットそのもの。外から来た値なので形を確かめてから使う
const GA_CLIENT_ID = /^\d{1,20}\.\d{1,20}$/

// 引数の `string | null` は「文字列か null のどちらか」という型（ユニオン型）。URL のクエリは無いと null になる
export function buildState(period: string | null, cid: string | null, lang: string | null): string {
  const safePeriod = period && VALID_PERIODS.includes(period) ? period : '90'
  const safeCid = cid && GA_CLIENT_ID.test(cid) ? cid : ''
  const safeLang = isLocale(lang) && lang !== DEFAULT_LOCALE ? lang : ''
  // 空の項目は後ろから省く（日本語・cid なしなら '90' だけ。以前の形と同じなので、古い state もそのまま読める）
  return [safePeriod, safeCid, safeLang].join(':').replace(/:+$/, '')
}

export function parseState(state: string | null): { periodDays: number; cid: string | null; locale: Locale } {
  // `??` は左が null / undefined のときだけ右を使う。split の結果を [period, cid, lang] で受けるのは分割代入
  const [period, cid, lang] = (state ?? '').split(':')
  return {
    // 数字でない・範囲外の値が来ても 90〜365 日に収める（parseInt が NaN なら || で 90 になる）
    periodDays: Math.min(365, Math.max(90, parseInt(period, 10) || 90)),
    cid: cid && GA_CLIENT_ID.test(cid) ? cid : null,
    // 外から来た値なので、知っている言語でなければ日本語にする
    locale: isLocale(lang) ? lang : DEFAULT_LOCALE,
  }
}
