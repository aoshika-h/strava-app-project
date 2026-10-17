// Strava API連携モジュール
// OAuth認証・アクティビティ取得・アスリート情報取得を担当

const STRAVA_API_BASE = 'https://www.strava.com/api/v3'

// Stravaのアクティビティデータ型（必要な項目のみ定義）
export interface StravaActivity {
  id: number
  name: string
  type: string          // 'Ride', 'VirtualRide', 'Run' など
  sport_type: string
  distance: number      // メートル
  moving_time: number   // 秒
  elapsed_time: number  // 秒
  total_elevation_gain: number  // メートル（獲得標高）
  average_speed: number  // m/s（km/hに変換: ×3.6）
  max_speed: number      // m/s
  average_watts?: number  // パワーメーターがある場合のみ
  max_watts?: number
  weighted_average_watts?: number  // NP（Normalized Power）
  average_heartrate?: number
  max_heartrate?: number
  start_date: string    // ISO 8601形式
  suffer_score?: number  // Stravaの運動負荷スコア
  kilojoules?: number   // 消費エネルギー
}

// アスリートプロフィール型
export interface StravaAthlete {
  id: number
  firstname: string
  lastname: string
  username: string
  profile: string       // プロフィール画像URL
  sex?: 'M' | 'F'      // 性別（設定している場合）
  city?: string
  country?: string
  weight?: number       // kg（設定している場合）
  ftp?: number          // FTP（設定している場合）
  measurement_preference: string
}

// OAuthトークンレスポンス型
export interface StravaTokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete: StravaAthlete
}

// 認証コードをアクセストークンに交換する
// Stravaのコールバックから受け取ったcodeを使ってトークンを取得
export async function exchangeCode(code: string): Promise<StravaTokenResponse> {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    // サンドボックスモードの50アスリート上限超過を検出
    if (res.status === 403 || text.includes('above limit') || text.includes('athlete')) {
      const err = new Error('athlete_limit') as Error & { code: string }
      err.code = 'athlete_limit'
      throw err
    }
    throw new Error(`Stravaトークン交換失敗: ${res.status} - ${text}`)
  }

  return res.json()
}

// 直近のアクティビティ一覧を取得する
// after: UNIXタイムスタンプ（この日時以降のアクティビティを取得）
// perPage: 1回で取得する件数（最大200）
export async function getActivities(
  accessToken: string,
  after: number,
  perPage = 100
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    per_page: String(perPage),
    after: String(after),
  })

  const res = await fetch(`${STRAVA_API_BASE}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error(`アクティビティ取得失敗: ${res.status}`)
  }

  return res.json()
}

// アスリートプロフィールを取得する（体重・FTPなどに使用）
export async function getAthlete(accessToken: string): Promise<StravaAthlete> {
  const res = await fetch(`${STRAVA_API_BASE}/athlete`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error(`アスリート情報取得失敗: ${res.status}`)
  }

  return res.json()
}
