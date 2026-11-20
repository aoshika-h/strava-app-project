// Strava OAuth の state に載せる値（分析期間と GA の client_id）の組み立てと解析
// state は「期間」または「期間:client_id」

const VALID_PERIODS = ['90', '180', '365']
// GA の client_id（例 123456789.1700000000）。Strava 認証の前後でブラウザが変わっても同じ人として計測するために持ち回る
const GA_CLIENT_ID = /^\d{1,20}\.\d{1,20}$/

export function buildState(period: string | null, cid: string | null): string {
  const safePeriod = period && VALID_PERIODS.includes(period) ? period : '90'
  return cid && GA_CLIENT_ID.test(cid) ? `${safePeriod}:${cid}` : safePeriod
}

export function parseState(state: string | null): { periodDays: number; cid: string | null } {
  const [period, cid] = (state ?? '').split(':')
  return {
    periodDays: Math.min(365, Math.max(90, parseInt(period, 10) || 90)),
    cid: cid && GA_CLIENT_ID.test(cid) ? cid : null,
  }
}
