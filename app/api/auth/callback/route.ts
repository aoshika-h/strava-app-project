// Strava OAuth のコールバック: トークン取得 → アクティビティ取得 → 連携解除 → 診断 → 結果ページへ
// URL は /api/auth/callback?code=...&state=... 。ユーザーが Strava の許可画面で「許可」を押すと Strava がここへ戻す。
// 診断の中心で、サーバーにデータを保存せず、結果は URL に載せて結果ページへ渡す（セッションレス設計）。
// 出てくる概念: async / await、try / catch、Promise の .finally()、リダイレクト

import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, getActivities, revokeToken } from '@/lib/strava'
import { analyzeCharacter } from '@/lib/analysis'
import { encodeResult } from '@/lib/result-data'
import { parseState } from '@/lib/oauth-state'

// async にしているのは、Strava への通信の完了を await で待つため
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl

  // ユーザーが許可画面で「キャンセル」を押すと error 付きで戻ってくる
  if (searchParams.get('error')) {
    return NextResponse.redirect(`${origin}/?error=access_denied`)
  }

  const code = searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`)
  }

  // try の中で起きたエラー（通信失敗など）は catch に飛ぶ。どこで失敗してもトップに戻してエラー表示する
  try {
    const { periodDays, cid } = parseState(searchParams.get('state'))

    // code（一度きりの引換券）を、APIを呼ぶためのアクセストークンに交換する
    const { access_token, refresh_token, athlete } = await exchangeCode(code)
    const since = Math.floor(Date.now() / 1000) - periodDays * 24 * 60 * 60
    // 診断は1回きりでトークンを使い続けないため、取得し終えたら成否に関わらず連携を解除する
    // .finally() は Promise が成功しても失敗しても最後に必ず実行される（失敗時はこのあと catch に進む）
    const activities = await getActivities(access_token, since).finally(() => revokeToken(refresh_token))

    const result = analyzeCharacter(activities, athlete, periodDays)

    // 診断結果を JSON → Base64url にして URL に載せ、結果ページへ移動させる（cid は GA で同じ人として数えるための ID）
    return NextResponse.redirect(`${origin}/result?data=${encodeResult(result)}${cid ? `&cid=${cid}` : ''}`)
  } catch (err) {
    console.error('Strava診断エラー:', err)
    // catch で受け取る err の型は不明（unknown）なので、as で形を仮定して code を読む
    if ((err as { code?: string }).code === 'athlete_limit') {
      return NextResponse.redirect(`${origin}/?error=athlete_limit`)
    }
    return NextResponse.redirect(`${origin}/?error=analysis_failed`)
  }
}
