// Strava API連携モジュール
// OAuth認証・アクティビティ取得・アスリート情報取得を担当

const STRAVA_API_BASE = 'https://www.strava.com/api/v3'

// Stravaのアクティビティデータ型（必要な項目のみ定義）
export interface StravaActivity {
  // 2027-06-01以降 id は64bit整数になりJSの number では精度が落ちるため、IDは文字列の id_str を使う
  id_str: string
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
  start_date: string    // ISO 8601形式（UTC）
  start_date_local: string  // 現地時刻（日付単位の集計に使う）
  suffer_score?: number  // Stravaの運動負荷スコア
  kilojoules?: number   // 消費エネルギー
}

// アスリートプロフィール型
export interface StravaAthlete {
  id_str: string  // StravaActivity と同じ理由で id ではなく id_str を使う
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

const PER_PAGE = 200
// レート制限（読み取り300回/15分）を1人で使い切らないための上限。1,000件/期間あれば1年分でも足りる
const MAX_PAGES = 5

// 指定日時以降のアクティビティを全件取得する（1ページ200件まで。ページを進めて期間内をすべて集める）
// after: UNIXタイムスタンプ
export async function getActivities(accessToken: string, after: number): Promise<StravaActivity[]> {
  const all: StravaActivity[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = new URLSearchParams({ per_page: String(PER_PAGE), after: String(after), page: String(page) })
    const res = await fetch(`${STRAVA_API_BASE}/athlete/activities?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      throw new Error(`アクティビティ取得失敗: ${res.status}`)
    }
    const batch: StravaActivity[] = await res.json()
    all.push(...batch)
    if (batch.length < PER_PAGE) break
  }
  return all
}

// アプリの連携を解除する（アクセス/リフレッシュ両方のトークンが無効になり、接続アスリート枠も空く）
// 診断の成否に影響させないため、失敗はログのみで例外を投げない
export async function revokeToken(refreshToken: string): Promise<void> {
  const credentials = Buffer.from(`${process.env.STRAVA_CLIENT_ID}:${process.env.STRAVA_CLIENT_SECRET}`).toString('base64')
  try {
    const res = await fetch('https://www.strava.com/oauth/revoke', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ token: refreshToken, token_type_hint: 'refresh_token' }),
    })
    if (!res.ok) console.error(`Strava連携解除失敗: ${res.status}`)
  } catch (e) {
    console.error('Strava連携解除エラー:', e)
  }
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
