// OAuthコールバックエンドポイント
// Stravaから認証コードを受け取り、トークン交換 → データ取得 → キャラクター判定 → 結果ページへリダイレクト

import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, getActivities } from '@/lib/strava'
import { analyzeCharacter } from '@/lib/character'
import { analyzePersonality } from '@/lib/personality'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Stravaがエラーを返した場合（ユーザーが拒否したなど）
  const error = searchParams.get('error')
  if (error) {
    return NextResponse.redirect(`${BASE_URL}/?error=access_denied`)
  }

  // Stravaから受け取った認証コード
  const code = searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(`${BASE_URL}/?error=no_code`)
  }

  try {
    // stateパラメータから期間日数を取得（デフォルト90日）
    const periodDays = Math.min(365, Math.max(90, parseInt(searchParams.get('state') ?? '90', 10) || 90))

    // ステップ1: 認証コードをアクセストークンに交換
    const tokenData = await exchangeCode(code)
    const { access_token, athlete } = tokenData

    // ステップ2: 指定期間分のアクティビティを取得
    const since = Math.floor(Date.now() / 1000) - periodDays * 24 * 60 * 60
    const activities = await getActivities(access_token, since, 200)

    // ステップ3: アクティビティデータを分析してキャラクターを判定
    const result = analyzeCharacter(activities, athlete, periodDays)

    // ステップ3.5: 説明文から性格コメントを生成（失敗時はnull）
    const descriptions = activities
      .map((a) => a.description ?? '')
      .filter(Boolean)
    result.personalityComment = await analyzePersonality(descriptions)

    // ステップ4: 結果をBase64エンコードしてURLパラメータとして渡す
    // サーバーサイドのセッションを使わずにVercelで動作させるため
    const encoded = Buffer.from(JSON.stringify(result)).toString('base64url')

    // 結果ページへリダイレクト
    return NextResponse.redirect(`${BASE_URL}/result?data=${encoded}`)
  } catch (err) {
    console.error('Strava診断エラー:', err)
    const code = (err as { code?: string }).code
    if (code === 'athlete_limit') {
      return NextResponse.redirect(`${BASE_URL}/?error=athlete_limit`)
    }
    return NextResponse.redirect(`${BASE_URL}/?error=analysis_failed`)
  }
}
