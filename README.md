# VeloAva

Stravaのライドデータを分析して、6種類のサイクリストキャラクター（アバター）を診断するWebアプリです。

## キャラクタータイプ

| キャラ | 説明 |
|--------|------|
| 🏔️ クライマー | 獲得標高が高い山岳系ライダー |
| ⚡ スプリンター | 高速・短距離型 |
| ⏱️ タイムトライアリスト | 持続的な高速巡航 |
| 🌄 グランフォンドライダー | 平均100km超の超長距離派 |
| 🎯 オールラウンダー | バランスが取れた万能型 |
| ☀️ サンデーライダー | マイペースな週末ライダー |

## セットアップ

### 1. Stravaアプリを作成

1. https://www.strava.com/settings/api にアクセス
2. アプリを新規作成
3. **Authorization Callback Domain** に以下を設定：
   - ローカル: `localhost`
   - Vercel: `your-app.vercel.app`

### 2. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```
STRAVA_CLIENT_ID=取得したClient ID
STRAVA_CLIENT_SECRET=取得したClient Secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. インストール & 起動

```bash
npm install
npm run dev
```

http://localhost:3000 でアクセス

## Vercelへのデプロイ

1. GitHubにプッシュ
2. https://vercel.com でリポジトリを連携
3. 環境変数を設定（`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `NEXT_PUBLIC_BASE_URL`）
4. デプロイ後、Stravaアプリの **Authorization Callback Domain** を `your-app.vercel.app` に更新

## 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **API**: Strava API v3
- **Deployment**: Vercel (無料プラン対応)
