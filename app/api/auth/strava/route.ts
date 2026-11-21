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
  // 既定は公開・フォロワー限定のアクティビティだけ（連携をためらわせないため）。
  // ローラーを「自分のみ」にしている人が自分で選んだときだけ read_all を求める
  const includePrivate = searchParams.get('private') === '1'
  authUrl.searchParams.set('scope', includePrivate ? 'read,activity:read_all' : 'read,activity:read')
  // 期間（と GA の client_id）を state でコールバックに引き渡す
  authUrl.searchParams.set('state', buildState(searchParams.get('period'), searchParams.get('cid')))

  return NextResponse.redirect(authUrl.toString())
}
