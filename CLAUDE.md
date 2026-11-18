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

OAuthの戻り先（redirect_uri）と認証後のリダイレクトは、`NEXT_PUBLIC_BASE_URL` ではなくアクセス中のオリジン（`request.nextUrl.origin`）を使う。そのため本番・Vercelプレビュー・ローカルのどれでも、アクセスしたURLに戻ってくる。

Stravaアプリの **Authorization Callback Domain** は `vercel.app` に設定している。Stravaは登録ドメインのサブドメインを許可するため、本番（`veloava.vercel.app`）とプレビュー（`veloava-git-…-aoshika-hs-projects.vercel.app`）の両方が通る。localhostはStrava側で常に許可されている。独自ドメインに移行したらそのドメインに変更する。

プレビューでStravaログインを試すには、Vercelの環境変数 `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` を **Preview** 環境にも設定しておく。

## アーキテクチャ

### MVC構成

| 層 | 場所 | 役割 |
|----|------|------|
| ルーティング | `app/` | Next.jsのファイル規約（page / route / layout / opengraph-image）のみ。controllerを呼んでviewに渡すだけの薄い層に保つ |
| Controller | `controllers/` | リクエストの解釈、modelの呼び出し、viewに渡すデータの組み立て、リダイレクト |
| Model | `models/` | データとビジネスロジック（キャラ定義、診断、Strava API、前回結果の保存） |
| View | `views/` | 画面コンポーネント。データ取得やURL解釈はしない |
| ユーティリティ | `lib/` | GA送信など横断的な小物 |

- `controllers/shareController.ts` は `node:fs` と `next/og` を使うサーバー専用。クライアントコンポーネント（`'use client'`）から import しない。必要な値はページ（サーバー）で計算してpropsで渡す
- `views/` にTailwindクラスを書くため、`tailwind.config.ts` の `content` に `./views/**` を含めている

### 全体フロー

```
/ (app/page.tsx → views/home/HomeView)
  └─ ① タイプ予想 → ② 期間選択（views/home/DiagnosisStarter → PeriodButtons）→ /api/auth/strava?period=90|180|365
       └─ authController.startAuthorization: Strava OAuth（stateで期間を引き渡す）
            └─ /api/auth/callback → authController.handleCallback
                 ├─ models/strava: exchangeCode() / getActivities() → revokeToken()（連携解除）
                 ├─ models/analysis: analyzeCharacter()
                 └─ resultController.encodeResult() → /result?data=...
                      └─ app/result/page.tsx（サーバー）→ resultController.getResultPageData()
                           └─ views/result/ResultView → ShareCard / InsightsCard / EvolutionCard / RadarChart
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

### AI機能は使わない

Strava API Policy 5.3条により、Strava Data（APIで取得した全データと、そこから派生した統計・スコア・診断結果を含む）をAIに渡すこと（コンテキストへの投入を含む）は禁止されている。以前あったAI性格コメント機能はこのため削除した。Stravaから来たデータやその派生データを、LLMなどのAIサービスに送る機能は追加しない。

### ライドの一言コメント (`models/insights.ts`)

`buildInsights()` が統計・スコアから「富士山○個分」「週○回、継続の鬼」のようなコメントをルールで組み立て、重みの高い順に別カテゴリから最大3つ選ぶ（`resultController` で生成し `views/result/InsightsCard.tsx` が表示）。`buildChangeInsights()` はブラウザに保存した前回のキャラ・スコアとの差分コメントを作り、`EvolutionCard` に出す。AIは使わない。数値を含むため結果ページの本人向け表示に限り、シェアカード・OGP画像には載せない。新しいコメントは `RULES` に関数を1つ足せば増やせる。

### 頻度と前回比較の注意点

- 頻度は「週あたりの乗った日数」（`ridingDaysPerWeek`、`start_date_local` の日付で数える）。Zwiftなど屋内ライドや1回の外出の分割で件数が膨らむため、アクティビティ件数では数えない。旧URLの `ridesPerWeek` は `resultController.decodeResult` で読み替える
- 前回結果（`models/resultHistory.ts`）は分析期間ごとに1件ずつ保存し、同じ期間どうしでのみ比較する。期間が違う診断を比べると数値が大きくぶれるため

### シェアカード (`views/result/ShareCard.tsx`)

`html2canvas` でDOMをキャプチャして画像化する。Tailwindクラスはキャプチャ時に取りこぼすため、カード内のスタイルはすべてinline styleで記述する（Tailwindクラスはカード外のUIにのみ使用）。

- **SP/タブレット** (`navigator.maxTouchPoints > 0`): Web Share API (`navigator.share`) でネイティブ共有シートを表示
- **PC**: PNGファイルをダウンロード

### Xシェア (`app/c/[slug]/` + `controllers/shareController.ts`)

結果ページの「Xでポスト」ボタンは `/c/{characterId}_{sex}` をintent URLで投稿する。`shareController.createShareOgImage()` が `next/og` でキャラ別OGP画像（レイアウトは `views/share/OgImageView.tsx`）を生成し、Xのタイムラインに画像付きカードを出す。キャラ画像はfsで読むため `next.config.mjs` の `outputFileTracingIncludes` で関数にバンドルしている。日本語フォントはGoogle FontsからNoto Sans JPを必要文字だけ取得する。

### GA4 計測

`NEXT_PUBLIC_GA_ID` が設定されているときだけ送信する（`lib/gtag.ts`）。クリック計測は、ハンドラを持つボタンは `gtagEvent()` を直接呼び、それ以外のリンクは要素に `data-ga-event`（と任意で `data-ga-id`）を付ければ `views/common/ClickTracker.tsx` が拾う。

| イベント | 発生箇所 | パラメータ |
|---|---|---|
| `diagnosis_start` | トップの期間ボタン | `period`, `predicted_type` |
| `share_x` | 結果ページの「Xでポスト」（GA側でキーイベント＝CVに設定） | なし |
| `share_card` | 結果ページの保存・共有ボタン | `method` = share / download |
| `retry_diagnosis` | 結果ページの「もう一度診断する」 | なし |
| `share_page_cta` | キャラ紹介ページ（`/c/...`）の「あなたも診断する」 | なし |
| `ui_click` | その他のリンク | `button_id` |

ユーザープロパティ `predicted_type`（ユーザー単位のカスタムディメンション）には、診断前にユーザーが選んだ予想タイプ（6キャラのID または `unknown`）を送る。ユーザー自身の入力なのでStrava由来ではない。

診断結果のキャラや性別などStrava由来のデータはイベントにもユーザープロパティにも載せない（API Policy 5.4）。予想と結果の一致/不一致も結果を含むので送らない。予想は `models/prediction.ts` でlocalStorageに保存し、結果ページの `PredictionReveal` で一度だけ答え合わせして消す。

### プレビューモード

`/result?preview=climber&sex=female` のようにURLパラメータを指定するとモックデータで結果ページをテスト表示できる（`?data=` より優先）。キャラクターID: `climber | sprinter | tt | granfondo | allrounder | weekend`。

## Strava API の制約

- 本番アクセス承認済み（2026年11月）。接続アスリート数は**999人上限**。超過時は `exchangeCode()` が `err.code === 'athlete_limit'` エラーを投げ、トップページに `?error=athlete_limit` でリダイレクトされる。
- レート制限: 全体 600リクエスト/15分・6,000/日、読み取り 300/15分・3,000/日。1診断あたりのAPI呼び出しはアクティビティ取得が200件ごとに1回（`models/strava.ts` の `MAX_PAGES` で最大5回）。
- スコープ: `read,activity:read`（公開・フォロワー限定のアクティビティのみ。「自分のみ」の非公開アクティビティとプライバシーゾーンは読まない。連携をためらわせないため `read_all` は使わない）
- 診断は1回きりの用途なので、アクティビティ取得後に成否に関わらず `revokeToken()`（`POST /oauth/revoke`）で連携を解除し、接続アスリート枠を空ける。旧 `/oauth/deauthorize` は2027-06-01で廃止されるため使わない
- アクティビティ・アスリートのIDは `id`（2027-06-01以降64bit整数でJSでは精度が落ちる）ではなく文字列の `id_str` を使う
- アクティビティ取得: 最大200件/リクエスト。期間内の全件をページングで取得する（1年で200件を超える人が普通にいるため）

## デプロイ

Vercel（無料プラン対応）。環境変数4つをVercelダッシュボードで設定し、`NEXT_PUBLIC_BASE_URL` をVercelの割り当てURLに合わせる。GitHubプッシュで自動デプロイ。本番URL: https://veloava.vercel.app
