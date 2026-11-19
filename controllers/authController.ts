// Strava OAuthの開始とコールバック処理
// 認証 → アクティビティ取得 → 診断 → 結果ページへのリダイレクトまでを担う

import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, getActivities, revokeToken } from '@/models/strava'
import { analyzeCharacter } from '@/models/analysis'
import { encodeResult } from './resultController'

const VALID_PERIODS = ['90', '180', '365']
// GA の client_id（例 123456789.1700000000）。Strava 認証の前後でブラウザが変わっても同じ人として計測するために持ち回る
const GA_CLIENT_ID = /^\d{1,20}\.\d{1,20}$/

// state は「期間」または「期間:client_id」
function parseState(state: string | null): { periodDays: number; cid: string | null } {
  const [period, cid] = (state ?? '').split(':')
  return {
    periodDays: Math.min(365, Math.max(90, parseInt(period, 10) || 90)),
    cid: cid && GA_CLIENT_ID.test(cid) ? cid : null,
  }
}

export function startAuthorization(request: NextRequest): NextResponse {
  const clientId = process.env.STRAVA_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'STRAVA_CLIENT_IDが設定されていません' }, { status: 500 })
  }

  // 戻り先はアクセス中のオリジン（本番・プレビュー・ローカルで共通に動かすため）
  const origin = request.nextUrl.origin
  const period = request.nextUrl.searchParams.get('period') ?? '90'
  const safePeriod = VALID_PERIODS.includes(period) ? period : '90'

  const authUrl = new URL('https://www.strava.com/oauth/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', `${origin}/api/auth/callback`)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('approval_prompt', 'auto')
  // 非公開（自分のみ）のアクティビティやプライバシーゾーンは診断に不要なので read_all は求めない
  authUrl.searchParams.set('scope', 'read,activity:read')
  // 期間（と GA の client_id）を state でコールバックに引き渡す
  const cid = request.nextUrl.searchParams.get('cid')
  authUrl.searchParams.set('state', cid && GA_CLIENT_ID.test(cid) ? `${safePeriod}:${cid}` : safePeriod)

  return NextResponse.redirect(authUrl.toString())
}

export async function handleCallback(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl

  if (searchParams.get('error')) {
    return NextResponse.redirect(`${origin}/?error=access_denied`)
  }

  const code = searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`)
  }

  try {
    const { periodDays, cid } = parseState(searchParams.get('state'))

    const { access_token, refresh_token, athlete } = await exchangeCode(code)
    const since = Math.floor(Date.now() / 1000) - periodDays * 24 * 60 * 60
    // 診断は1回きりでトークンを使い続けないため、取得し終えたら成否に関わらず連携を解除する
    const activities = await getActivities(access_token, since).finally(() => revokeToken(refresh_token))

    const result = analyzeCharacter(activities, athlete, periodDays)

    return NextResponse.redirect(`${origin}/result?data=${encodeResult(result)}${cid ? `&cid=${cid}` : ''}`)
  } catch (err) {
    console.error('Strava診断エラー:', err)
    if ((err as { code?: string }).code === 'athlete_limit') {
      return NextResponse.redirect(`${origin}/?error=athlete_limit`)
    }
    return NextResponse.redirect(`${origin}/?error=analysis_failed`)
  }
}
