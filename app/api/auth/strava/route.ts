// OAuth認証開始エンドポイント
// ユーザーをStravaの認証ページにリダイレクトする

import { NextRequest, NextResponse } from 'next/server'

const VALID_PERIODS = ['90', '180', '365']

export async function GET(request: NextRequest) {
  const clientId = process.env.STRAVA_CLIENT_ID
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  if (!clientId) {
    return NextResponse.json({ error: 'STRAVA_CLIENT_IDが設定されていません' }, { status: 500 })
  }

  // 期間パラメータを取得（デフォルト90日）
  const period = request.nextUrl.searchParams.get('period') ?? '90'
  const safePeriod = VALID_PERIODS.includes(period) ? period : '90'

  const redirectUri = `${baseUrl}/api/auth/callback`

  const stravaAuthUrl = new URL('https://www.strava.com/oauth/authorize')
  stravaAuthUrl.searchParams.set('client_id', clientId)
  stravaAuthUrl.searchParams.set('redirect_uri', redirectUri)
  stravaAuthUrl.searchParams.set('response_type', 'code')
  stravaAuthUrl.searchParams.set('approval_prompt', 'auto')
  stravaAuthUrl.searchParams.set('scope', 'read,activity:read_all')
  // 期間をstateパラメータでコールバックに引き渡す
  stravaAuthUrl.searchParams.set('state', safePeriod)

  return NextResponse.redirect(stravaAuthUrl.toString())
}
