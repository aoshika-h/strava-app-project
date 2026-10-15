// OAuth認証開始エンドポイント
// ユーザーをStravaの認証ページにリダイレクトする

import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  if (!clientId) {
    return NextResponse.json({ error: 'STRAVA_CLIENT_IDが設定されていません' }, { status: 500 })
  }

  // Stravaが認証後にリダイレクトするURL
  const redirectUri = `${baseUrl}/api/auth/callback`

  // Strava OAuth URLを組み立て
  // scope: activity:read_all = 全アクティビティの読み取り権限
  const stravaAuthUrl = new URL('https://www.strava.com/oauth/authorize')
  stravaAuthUrl.searchParams.set('client_id', clientId)
  stravaAuthUrl.searchParams.set('redirect_uri', redirectUri)
  stravaAuthUrl.searchParams.set('response_type', 'code')
  stravaAuthUrl.searchParams.set('approval_prompt', 'auto')  // 既に許可済みなら認証画面をスキップ
  stravaAuthUrl.searchParams.set('scope', 'read,activity:read_all')

  // Stravaの認証ページにリダイレクト
  return NextResponse.redirect(stravaAuthUrl.toString())
}
