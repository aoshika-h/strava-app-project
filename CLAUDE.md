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

### MVC構成

| 層 | 場所 | 役割 |
|----|------|------|
| ルーティング | `app/` | Next.jsのファイル規約（page / route / layout / opengraph-image）のみ。controllerを呼んでviewに渡すだけの薄い層に保つ |
| Controller | `controllers/` | リクエストの解釈、modelの呼び出し、viewに渡すデータの組み立て、リダイレクト |
| Model | `models/` | データとビジネスロジック（キャラ定義、診断、Strava API、AIコメント、前回結果の保存） |
| View | `views/` | 画面コンポーネント。データ取得やURL解釈はしない |
| ユーティリティ | `lib/` | GA送信など横断的な小物 |

- `controllers/shareController.ts` は `node:fs` と `next/og` を使うサーバー専用。クライアントコンポーネント（`'use client'`）から import しない。必要な値はページ（サーバー）で計算してpropsで渡す
- `views/` にTailwindクラスを書くため、`tailwind.config.ts` の `content` に `./views/**` を含めている

### 全体フロー

```
/ (app/page.tsx → views/home/HomeView)
  └─ 期間選択（views/home/PeriodButtons）→ /api/auth/strava?period=90|180|365
       └─ authController.startAuthorization: Strava OAuth（stateで期間を引き渡す）
            └─ /api/auth/callback → authController.handleCallback
                 ├─ models/strava: exchangeCode() / getActivities()
                 ├─ models/analysis: analyzeCharacter()
                 ├─ models/personality: analyzePersonality()（任意）
                 └─ resultController.encodeResult() → /result?data=...
                      └─ app/result/page.tsx（サーバー）→ resultController.getResultPageData()
                           └─ views/result/ResultView → ShareCard / EvolutionCard / RadarChart
```

### セッションレス設計

サーバーサイドのセッションは使用しない。分析結果（`AnalysisResult`）をJSON→Base64url（UTF-8）でエンコードしてURLパラメータ `?data=` に乗せる。エンコード・デコードはともに `controllers/resultController.ts` がサーバー側で行う（ブラウザの `atob` は日本語が文字化けするため使わない）。

### キャラクター判定ロジック (`models/analysis.ts`)

`analyzeCharacter()` がStravaアクティビティから統計を算出し、6キャラクターへのスコアを積み上げて最大値のキャラクターを選択する。スコアに使う指標:

- **登坂比率** (m/km) → climber・granfondo に加点
- **平均距離** (km) → granfondo・tt に加点
- **平均速度** (km/h) → sprinter・tt に加点
- **短距離補正** (平均距離が短いほど) → sprinter に加点
- **頻度の低さ** → weekend に加点
- **パワー** (パワーメーターがある場合) → tt・climber に加点

### キャラクター定義 (`models/characters/`)

- `types.ts`: `CHARACTER_IDS`・`Character`（性別共通の属性）・`CharacterVariant`（性別ごとのテキスト）
- `data.ts`: 6キャラの定義データのみ。テキストの修正はここだけ
- `index.ts`: 読み出し窓口（`getCharacter` / `getVariant(id, sex)` / `listCharacters` / `isCharacterId`）。アプリは必ずここ経由で参照する。保存先をDB等に移す場合はこのファイルの実装だけを差し替える

性別テキストは `variants.male` / `variants.female` に対称に持つ（多言語化する場合も同じ形で拡張する）。キャラクター画像は `public/characters/{characterId}_{sex}.png`（例: `climber_male.png`）。

### AI性格コメント (`models/personality.ts`)

アクティビティの `description`（説明文フィールド）を収集してClaude Haiku APIに送信し、ライダーの性格コメントを生成する。意味ある説明文が3件未満・APIキー未設定・APIエラーの場合はすべて `null` を返し、`ShareCard.tsx` が既存のキャラクター `description`/`lore` にフォールバックする。Anthropic APIはデフォルトでデータをモデル学習に利用しない。

### シェアカード (`views/result/ShareCard.tsx`)

`html2canvas` でDOMをキャプチャして画像化する。Tailwindクラスはキャプチャ時に取りこぼすため、カード内のスタイルはすべてinline styleで記述する（Tailwindクラスはカード外のUIにのみ使用）。

- **SP/タブレット** (`navigator.maxTouchPoints > 0`): Web Share API (`navigator.share`) でネイティブ共有シートを表示
- **PC**: PNGファイルをダウンロード

### Xシェア (`app/c/[slug]/` + `controllers/shareController.ts`)

結果ページの「Xでポスト」ボタンは `/c/{characterId}_{sex}` をintent URLで投稿する。`shareController.createShareOgImage()` が `next/og` でキャラ別OGP画像（レイアウトは `views/share/OgImageView.tsx`）を生成し、Xのタイムラインに画像付きカードを出す。キャラ画像はfsで読むため `next.config.mjs` の `outputFileTracingIncludes` で関数にバンドルしている。日本語フォントはGoogle FontsからNoto Sans JPを必要文字だけ取得する。

### プレビューモード

`/result?preview=climber&sex=female` のようにURLパラメータを指定するとモックデータで結果ページをテスト表示できる（`?data=` より優先）。キャラクターID: `climber | sprinter | tt | granfondo | allrounder | weekend`。

## Strava API の制約

- 本番アクセス承認済み（2026年11月）。接続アスリート数は**999人上限**。超過時は `exchangeCode()` が `err.code === 'athlete_limit'` エラーを投げ、トップページに `?error=athlete_limit` でリダイレクトされる。
- レート制限: 全体 600リクエスト/15分・6,000/日、読み取り 300/15分・3,000/日。1診断あたりのAPI呼び出しはアクティビティ取得1回。
- スコープ: `read,activity:read_all`
- アクティビティ取得: 最大200件/リクエスト（ページネーションは未実装）

## デプロイ

Vercel（無料プラン対応）。環境変数4つをVercelダッシュボードで設定し、`NEXT_PUBLIC_BASE_URL` をVercelの割り当てURLに合わせる。GitHubプッシュで自動デプロイ。本番URL: https://veloava.vercel.app
