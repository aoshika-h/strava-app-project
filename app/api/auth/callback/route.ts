// Strava OAuth のコールバック: トークン取得 → アクティビティ取得 → 連携解除 → 診断 → 結果ページへ

import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, getActivities, revokeToken } from '@/lib/strava'
import { analyzeCharacter } from '@/lib/analysis'
import { encodeResult } from '@/lib/result-data'
import { parseState } from '@/lib/oauth-state'

export async function GET(request: NextRequest) {
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
