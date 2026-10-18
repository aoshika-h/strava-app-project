# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # 開発サーバー起動 (localhost:3000)
npm run build    # 本番ビルド
npm run lint     # ESLint
npx tsc --noEmit # 型チェック（テストの代わりに使用）
```

テストフレームワークは未導入。型チェックとビルドが品質の主な確認手段。

## 環境変数

`.env.local` に以下が必要（`.env.example` を参照）:

| 変数 | 用途 |
|------|------|
| `STRAVA_CLIENT_ID` | Strava API Client ID |
| `STRAVA_CLIENT_SECRET` | Strava API Client Secret |
| `NEXT_PUBLIC_BASE_URL` | ベースURL（ローカル: `http://localhost:3000`、本番: Vercel URL） |
| `ANTHROPIC_API_KEY` | Claude APIキー（省略可。未設定時は性格コメント機能がフォールバックする） |

Stravaアプリの **Authorization Callback Domain** は `NEXT_PUBLIC_BASE_URL` のドメインと一致させる必要がある。

## アーキテクチャ

### 全体フロー

```
トップページ (app/page.tsx)
  └─ 期間選択（3ヶ月/6ヶ月/1年）→ /api/auth/strava?period=90|180|365
       └─ Strava OAuth認証（stateパラメータで期間を引き渡す）
            └─ /api/auth/callback
                 ├─ exchangeCode() → アクセストークン取得
                 ├─ getActivities() → アクティビティ一覧取得
                 ├─ analyzeCharacter() → キャラクター判定
                 ├─ analyzePersonality() → AI性格コメント生成（任意）
                 └─ Base64urlエンコード → /result?data=...
                      └─ ResultContent.tsx → ShareCard.tsx + 統計表示
```

### セッションレス設計

サーバーサイドのセッションは使用しない。分析結果（`AnalysisResult`）をJSON→Base64urlエンコードしてURLパラメータ `?data=` に乗せて結果ページに渡す。Vercelのサーバーレス環境で完結する。

### キャラクター判定ロジック (`lib/character.ts`)

`analyzeCharacter()` がStravaアクティビティから統計を算出し、6キャラクターへのスコアを積み上げて最大値のキャラクターを選択する。スコアに使う指標:

- **登坂比率** (m/km) → climber・granfondo に加点
- **平均距離** (km) → granfondo・tt に加点
- **平均速度** (km/h) → sprinter・tt に加点
- **短距離補正** (平均距離が短いほど) → sprinter に加点
- **頻度の低さ** → weekend に加点
- **パワー** (パワーメーターがある場合) → tt・climber に加点

### キャラクター性別対応

`CharacterType` は男性デフォルトのテキストを持ち、`female: GenderVariant` フィールドに女性版テキストを格納する。`getGenderText(character, sex)` で表示用テキストを取得する。キャラクター画像は `public/characters/{characterId}_{sex}.png`（例: `climber_male.png`）。

### AI性格コメント (`lib/personality.ts`)

アクティビティの `description`（説明文フィールド）を収集してClaude Haiku APIに送信し、ライダーの性格コメントを生成する。意味ある説明文が3件未満・APIキー未設定・APIエラーの場合はすべて `null` を返し、`ShareCard.tsx` が既存のキャラクター `description`/`lore` にフォールバックする。Anthropic APIはデフォルトでデータをモデル学習に利用しない。

### シェアカード (`app/result/ShareCard.tsx`)

`html2canvas` でDOMをキャプチャして画像化する。Tailwindクラスはキャプチャ時に取りこぼすため、カード内のスタイルはすべてinline styleで記述する（Tailwindクラスはカード外のUIにのみ使用）。

- **SP/タブレット** (`navigator.maxTouchPoints > 0`): Web Share API (`navigator.share`) でネイティブ共有シートを表示
- **PC**: PNGファイルをダウンロード

### プレビューモード

`/result?preview=climber&sex=female` のようにURLパラメータを指定するとモックデータで結果ページをテスト表示できる（`?data=` より優先）。キャラクターID: `climber | sprinter | tt | granfondo | allrounder | weekend`。

## Strava API の制約

- サンドボックスモードでは接続アスリート数が**10人上限**。超過時は `exchangeCode()` が `err.code === 'athlete_limit'` エラーを投げ、トップページに `?error=athlete_limit` でリダイレクトされる。本番利用にはStravaへの拡張申請が必要。
- スコープ: `read,activity:read_all`
- アクティビティ取得: 最大200件/リクエスト（ページネーションは未実装）

## デプロイ

Vercel（無料プラン対応）。環境変数4つをVercelダッシュボードで設定し、`NEXT_PUBLIC_BASE_URL` をVercelの割り当てURLに合わせる。GitHubプッシュで自動デプロイ。本番URL: https://veloava.vercel.app
