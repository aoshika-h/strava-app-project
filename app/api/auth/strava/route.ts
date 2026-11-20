// Strava OAuth の開始: Strava の許可画面へリダイレクトする

import { NextRequest, NextResponse } from 'next/server'
import { buildState } from '@/lib/oauth-state'

export function GET(request: NextRequest) {
  const clientId = process.env.STRAVA_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'STRAVA_CLIENT_IDが設定されていません' }, { status: 500 })
  }

  // 戻り先はアクセス中のオリジン（本番・プレビュー・ローカルで共通に動かすため）
  const { origin, searchParams } = request.nextUrl

  const authUrl = new URL('https://www.strava.com/oauth/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', `${origin}/api/auth/callback`)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('approval_prompt', 'auto')
  // 非公開（自分のみ）のアクティビティやプライバシーゾーンは診断に不要なので read_all は求めない
  authUrl.searchParams.set('scope', 'read,activity:read')
  // 期間（と GA の client_id）を state でコールバックに引き渡す
  authUrl.searchParams.set('state', buildState(searchParams.get('period'), searchParams.get('cid')))

  return NextResponse.redirect(authUrl.toString())
}
