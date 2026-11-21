// Strava OAuth の開始: Strava の許可画面へリダイレクトする
// URL は /api/auth/strava?period=180&cid=... 。route.ts は画面ではなく API（リクエストを受けて応答を返す）を作るファイル規約で、
// export した関数名（GET / POST など）が HTTP メソッドに対応する。
// OAuth の流れ: ①ここで Strava の許可画面へ飛ばす → ②ユーザーが許可 → ③Strava が /api/auth/callback に code を付けて戻す

import { NextRequest, NextResponse } from 'next/server'
import { buildState } from '@/lib/oauth-state'

// NextRequest は届いたリクエスト。request.nextUrl から URL のクエリやオリジンを取り出せる
export function GET(request: NextRequest) {
  const clientId = process.env.STRAVA_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'STRAVA_CLIENT_IDが設定されていません' }, { status: 500 })
  }

  // 戻り先はアクセス中のオリジン（本番・プレビュー・ローカルで共通に動かすため）
  const { origin, searchParams } = request.nextUrl

  // URL オブジェクトで組み立てると、searchParams.set が値のエスケープ（& や日本語の変換）を自動でやってくれる
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

  // NextResponse.redirect は「このURLへ移動して」という応答（HTTP 307）を返す。ブラウザが自動で Strava へ移る
  return NextResponse.redirect(authUrl.toString())
}
