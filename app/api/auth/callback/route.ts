// OAuthコールバックエンドポイント
// Stravaから認証コードを受け取り、トークン交換 → データ取得 → キャラクター判定 → 結果ページへリダイレクト

import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, getActivities } from '@/lib/strava'
import { analyzeCharacter } from '@/lib/character'

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
    // ステップ1: 認証コードをアクセストークンに交換
    // この1回だけのコードをStravaに渡してアクセストークンを取得
    const tokenData = await exchangeCode(code)
    const { access_token, athlete } = tokenData

    // ステップ2: 直近90日間のアクティビティを取得
    // UNIXタイムスタンプで90日前を計算
    const ninetyDaysAgo = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60
    const activities = await getActivities(access_token, ninetyDaysAgo, 100)

    // ステップ3: アクティビティデータを分析してキャラクターを判定
    const result = analyzeCharacter(activities, athlete, 90)

    // ステップ4: 結果をBase64エンコードしてURLパラメータとして渡す
    // サーバーサイドのセッションを使わずにVercelで動作させるため
    const encoded = Buffer.from(JSON.stringify(result)).toString('base64url')

    // 結果ページへリダイレクト
    return NextResponse.redirect(`${BASE_URL}/result?data=${encoded}`)
  } catch (err) {
    console.error('Strava診断エラー:', err)
    return NextResponse.redirect(`${BASE_URL}/?error=analysis_failed`)
  }
}
