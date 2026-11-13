// Strava OAuthの開始とコールバック処理
// 認証 → アクティビティ取得 → 診断 → 結果ページへのリダイレクトまでを担う

import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, getActivities, revokeToken } from '@/models/strava'
import { analyzeCharacter } from '@/models/analysis'
import { encodeResult } from './resultController'

const VALID_PERIODS = ['90', '180', '365']

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
  authUrl.searchParams.set('scope', 'read,activity:read_all')
  // 期間をstateパラメータでコールバックに引き渡す
  authUrl.searchParams.set('state', safePeriod)

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
    const periodDays = Math.min(365, Math.max(90, parseInt(searchParams.get('state') ?? '90', 10) || 90))

    const { access_token, refresh_token, athlete } = await exchangeCode(code)
    const since = Math.floor(Date.now() / 1000) - periodDays * 24 * 60 * 60
    // 診断は1回きりでトークンを使い続けないため、取得し終えたら成否に関わらず連携を解除する
    const activities = await getActivities(access_token, since, 200).finally(() => revokeToken(refresh_token))

    const result = analyzeCharacter(activities, athlete, periodDays)

    return NextResponse.redirect(`${origin}/result?data=${encodeResult(result)}`)
  } catch (err) {
    console.error('Strava診断エラー:', err)
    if ((err as { code?: string }).code === 'athlete_limit') {
      return NextResponse.redirect(`${origin}/?error=athlete_limit`)
    }
    return NextResponse.redirect(`${origin}/?error=analysis_failed`)
  }
}
