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

### ファイル構成（Next.js App Router の一般的な形）

| 場所 | 役割 |
|------|------|
| `app/` | ルーティング。各ページの `page.tsx` に画面を直接書き、そのページ専用の部品は同じフォルダの `_components/`（`_` で始まるフォルダはURLにならない）に置く。API は `route.ts` に処理を直接書く |
| `components/` | 複数のページで使う部品（`ClickTracker.tsx`） |
| `lib/` | データとロジック（キャラ定義、診断、コメント、Strava API、結果の変換、前回結果の保存、GA送信など）。画面から切り離して単体で調整・シミュレーションできるようにしている |

```
app/
├── page.tsx                  トップ（_components/: DiagnosisStarter, PeriodButtons, LatestUpdate）
├── layout.tsx                全ページ共通（GA の初期設定）
├── result/page.tsx           結果（_components/: ResultView, ShareCard, InsightsCard, EvolutionCard, RadarChart, PredictionReveal, ResultErrorView）
├── c/[slug]/page.tsx         キャラ紹介ページ（Xのカードの着地点）
├── c/[slug]/opengraph-image.tsx  キャラ別OGP画像
├── privacy/page.tsx          プライバシーポリシー
└── api/auth/{strava,callback}/route.ts  Strava OAuth の開始・コールバック
lib/
├── characters/               6キャラの定義（data.ts＝文章、index.ts＝読み出し窓口、types.ts）
├── analysis.ts               診断ロジック
├── insights.ts               一言コメント
├── strava.ts                 Strava API（取得・連携解除）
├── oauth-state.ts            OAuth の state（期間と GA client_id）
├── result-data.ts            結果のURLエンコード・復元、結果ページ用データの組み立て
├── share.ts                  シェアページの slug
├── result-history.ts / prediction.ts / changelog.ts / score-axes.ts / gtag.ts
```

- `app/c/[slug]/opengraph-image.tsx` は `node:fs` と `next/og` を使うサーバー専用。クライアントコンポーネント（`'use client'`）からサーバー専用のコードを import しない。必要な値はページ（サーバー）で計算してpropsで渡す
- 2026-11-20 までは `models/`・`views/`・`controllers/` に分けたMVC風の構成だった（main のコミット `7742e95`）。学習用に比較する場合はそこを見る

### 全体フロー

```
/ (app/page.tsx)
  └─ ① タイプ予想 → ② 期間選択（app/_components/DiagnosisStarter → PeriodButtons）→ /api/auth/strava?period=90|180|365&cid=<GA client_id>
       └─ app/api/auth/strava/route.ts: Strava OAuth（state に期間と client_id、lib/oauth-state）
            └─ app/api/auth/callback/route.ts
                 ├─ lib/strava: exchangeCode() / getActivities() → revokeToken()（連携解除）
                 ├─ lib/analysis: analyzeCharacter()
                 └─ lib/result-data: encodeResult() → /result?data=...
                      └─ app/result/page.tsx（サーバー）→ getResultPageData()
                           └─ app/result/_components/ResultView → ShareCard / InsightsCard / EvolutionCard / RadarChart
```

### セッションレス設計

サーバーサイドのセッションは使用しない。分析結果（`AnalysisResult`）をJSON→Base64url（UTF-8）でエンコードしてURLパラメータ `?data=` に乗せる。エンコード・デコードはともに `lib/result-data.ts` でサーバー側で行う（ブラウザの `atob` は日本語が文字化けするため使わない）。

### キャラクター判定ロジック (`lib/analysis.ts`)

`analyzeCharacter()` がStravaアクティビティから統計を算出し、5つの能力スコア（0〜100）を出す。速度・1回の距離・登坂比率は**屋外ライドだけ**で計算する（Zwiftなど `VirtualRide` や `trainer` のライドは速度が出やすく短い練習が多いため、混ぜるとスプリンター寄りに歪む）。屋外が1件もない人だけ屋内も含め、その場合の「スピード」スコアはパワーがあればパワーで代え（Zwiftの速度は実力より出やすいため）、「持久力」は1回の距離ではなく1回の時間（45分〜4時間）で測る。屋内ライドは、ERG練習で距離0のまま記録するアプリ（TrainerRoad、Wahoo SYSTMなど）があるため、距離0でも10分以上動いていれば数える。距離・速度・登坂比率は距離が記録されたライドだけで計算し、距離が1本もない人は結果ページで距離系のカードを出さない。合計距離・合計標高・乗った日数・パワーは屋内も含めた全ライドで出す。パワーは `device_watts === true` の実測値だけを使う（Stravaはパワーメーターがないライドにも推定値を返す）。範囲は一般的なロード乗りの分布に合わせている（登坂 3〜18 m/km、速度 20〜34 km/h、1回の距離 20〜120 km、パワー 120〜280 W、乗った日数 週0.5〜6日）。

`pickCharacter()` が各キャラの適合度を**重みの合計が1の加重平均**で出し、最大のキャラを選ぶ（入力の数でキャラ間に有利不利が出ないようにするため。以前は合計点で比べていて、材料の多いTTと速度で加点されるスプリンターに偏っていた）。

- climber: 登坂 0.8 + パワー 0.2
- granfondo: 距離 0.75 + 登坂 0.25
- tt: 速度 0.5 + 距離 0.2 + パワー 0.3（パワーの使い方が分かる人は 速度 0.4 + 距離 0.2 + パワー 0.25 + 一定ペース傾向 0.15）
- sprinter: 速度 0.7 + 短距離さ（100−距離）0.3 − 8（パワーの使い方が分かる人は 速度 0.4 + 短距離さ 0.2 + スプリント傾向 0.4 − 8）
- allrounder: 4能力（登坂・速度・距離・頻度）の平均 − 0.6×（最大−最小）+ 25（突出がなく全部そこそこ）
- weekend: 0.85 ×（100 − 頻度）（頻度が低くてもロング派はグランフォンドを優先）

パワーの使い方（`PowerProfile`）は実測パワーのライドが3本以上あるときだけ使う。秒ごとのデータ（ストリーム）は1ライド1リクエストかかりレート制限を圧迫するので取らず、要約の値から推定する。スプリント傾向＝最大パワー÷平均パワーの中央値（3〜7倍を0〜100）、一定ペース傾向＝NP÷平均パワーの中央値（1.03〜1.2を100〜0）。体重は今のスコープでは取れないので W/kg は使わない。

重みを変えたら、架空のライダー集団（屋内のみ・併用・パワメ有無を混ぜる）で各キャラの割合を確かめる（熱心な層で1キャラ30%超にならず、どのキャラも数%以上出ることが目安）。

### キャラクター定義 (`lib/characters/`)

- `types.ts`: `CHARACTER_IDS`・`Character`（性別共通の属性）・`CharacterVariant`（性別ごとのテキスト）
- `data.ts`: 6キャラの定義データのみ。テキストの修正はここだけ
- `index.ts`: 読み出し窓口（`getCharacter` / `getVariant(id, sex)` / `listCharacters` / `isCharacterId`）。アプリは必ずここ経由で参照する。保存先をDB等に移す場合はこのファイルの実装だけを差し替える

性別テキストは `variants.male` / `variants.female` に対称に持つ（多言語化する場合も同じ形で拡張する）。キャラクター画像は `public/characters/{characterId}_{sex}.png`（例: `climber_male.png`）。

### AI機能は使わない

Strava API Policy 5.3条により、Strava Data（APIで取得した全データと、そこから派生した統計・スコア・診断結果を含む）をAIに渡すこと（コンテキストへの投入を含む）は禁止されている。以前あったAI性格コメント機能はこのため削除した。Stravaから来たデータやその派生データを、LLMなどのAIサービスに送る機能は追加しない。

### ライドの一言コメント (`lib/insights.ts`)

`buildInsights()` が統計・スコアから「富士山○個分」「週○回、継続の鬼」のようなコメントをルールで組み立て、重みの高い順に別カテゴリから最大3つ選ぶ（`lib/result-data.ts` で生成し `app/result/_components/InsightsCard.tsx` が表示）。`buildChangeInsights()` はブラウザに保存した前回のキャラ・スコアとの差分コメントを作り、`EvolutionCard` に出す。AIは使わない。数値を含むため結果ページの本人向け表示に限り、シェアカード・OGP画像には載せない。新しいコメントは `RULES` に関数を1つ足せば増やせる。

### 頻度と前回比較の注意点

- 頻度は「週あたりの乗った日数」（`ridingDaysPerWeek`、`start_date_local` の日付で数える）。Zwiftなど屋内ライドや1回の外出の分割で件数が膨らむため、アクティビティ件数では数えない。旧URLの `ridesPerWeek` は `lib/result-data.ts` の `decodeResult` で読み替える
- 前回結果（`lib/result-history.ts`）は分析期間ごとに1件ずつ保存し、同じ期間どうしでのみ比較する。期間が違う診断を比べると数値が大きくぶれるため

### シェアカード (`app/result/_components/ShareCard.tsx`)

`html2canvas` でDOMをキャプチャして画像化する。Tailwindクラスはキャプチャ時に取りこぼすため、カード内のスタイルはすべてinline styleで記述する（Tailwindクラスはカード外のUIにのみ使用）。

- **SP/タブレット** (`navigator.maxTouchPoints > 0`): Web Share API (`navigator.share`) でネイティブ共有シートを表示
- **PC**: PNGファイルをダウンロード

### Xシェア (`app/c/[slug]/`)

結果ページの「Xでポスト」ボタンは `/c/{characterId}_{sex}` をintent URLで投稿する。`app/c/[slug]/opengraph-image.tsx` が `next/og` でキャラ別OGP画像を生成し、Xのタイムラインに画像付きカードを出す。キャラ画像はfsで読むため `next.config.mjs` の `outputFileTracingIncludes` で関数にバンドルしている。日本語フォントはGoogle FontsからNoto Sans JPを必要文字だけ取得する。

### GA4 計測

`NEXT_PUBLIC_GA_ID` が設定されているときだけ送信する（`lib/gtag.ts`）。プレビュー表示（`?preview=` 付きのURLで開いたとき）は `app/layout.tsx` で `gtag('config')` を呼ばないので、ページビューもイベントも送られない。

Strava認証ではXやLINEのアプリ内ブラウザからStravaアプリ・Safariに切り替わることが多く、GAでは別人として数えられる。そのため診断開始時にGAの `client_id` を取得し（`getGaClientId()`）、`/api/auth/strava?cid=` → OAuthの `state`（`期間:client_id`）→ `/result?...&cid=` と持ち回り、結果ページでは `gtag('config', GA_ID, { client_id })` で同じ人として計測してからURLの `cid` を消す。GAのリンカー（`_gl`）はブラウザが変わると無効になりStrava経由で消えるため使わない。クリック計測は、ハンドラを持つボタンは `gtagEvent()` を直接呼び、それ以外のリンクは要素に `data-ga-event`（と任意で `data-ga-id`）を付ければ `components/ClickTracker.tsx` が拾う。

| イベント | 発生箇所 | パラメータ |
|---|---|---|
| `diagnosis_start` | トップの期間ボタン | `period`, `predicted_type` |
| `share_x` | 結果ページの「Xでポスト」（GA側でキーイベント＝CVに設定） | なし |
| `share_card` | 結果ページの保存・共有ボタン | `method` = share / download |
| `retry_diagnosis` | 結果ページの「もう一度診断する」 | なし |
| `share_page_cta` | キャラ紹介ページ（`/c/...`）の「あなたも診断する」 | なし |
| `ui_click` | その他のリンク | `button_id` |

ユーザープロパティ `predicted_type`（ユーザー単位のカスタムディメンション）には、診断前にユーザーが選んだ予想タイプ（6キャラのID または `unknown`）を送る。ユーザー自身の入力なのでStrava由来ではない。

診断結果のキャラや性別などStrava由来のデータはイベントにもユーザープロパティにも載せない（API Policy 5.4）。予想と結果の一致/不一致も結果を含むので送らない。予想は `lib/prediction.ts` でlocalStorageに保存し、結果ページの `PredictionReveal` で一度だけ答え合わせして消す。

### 更新履歴 (`lib/changelog.ts`)

ユーザー向けの変更（判定・表示・プライバシーなど）をリリースしたら `CHANGELOG` の先頭に1件足す。先頭の1件は、以前に診断したことがある人（ブラウザに前回結果がある人）にだけ、公開から14日間トップのファーストビューに「NEW」として出る（`app/_components/LatestUpdate.tsx`。長い場合は `headline` に短い一文を入れる）。初めての人には関係のない話なので出さない。フッター（`#changelog`）には最新3件を出し、残りは「すべて見る」で開く。リファクタや計測など、ユーザーから見えない変更は載せない。

### プレビューモード

`/result?preview=climber&sex=female` のようにURLパラメータを指定するとモックデータで結果ページをテスト表示できる（`?data=` より優先）。キャラクターID: `climber | sprinter | tt | granfondo | allrounder | weekend`。

## Strava API の制約

- 本番アクセス承認済み（2026年11月）。接続アスリート数は**999人上限**。超過時は `exchangeCode()` が `err.code === 'athlete_limit'` エラーを投げ、トップページに `?error=athlete_limit` でリダイレクトされる。
- レート制限: 全体 600リクエスト/15分・6,000/日、読み取り 300/15分・3,000/日。1診断あたりのAPI呼び出しはアクティビティ取得が200件ごとに1回（`lib/strava.ts` の `MAX_PAGES` で最大5回）。
- スコープ: `read,activity:read`（公開・フォロワー限定のアクティビティのみ。「自分のみ」の非公開アクティビティとプライバシーゾーンは読まない。連携をためらわせないため `read_all` は使わない）
- 診断は1回きりの用途なので、アクティビティ取得後に成否に関わらず `revokeToken()`（`POST /oauth/revoke`）で連携を解除し、接続アスリート枠を空ける。旧 `/oauth/deauthorize` は2027-06-01で廃止されるため使わない
- アクティビティ・アスリートのIDは `id`（2027-06-01以降64bit整数でJSでは精度が落ちる）ではなく文字列の `id_str` を使う
- アクティビティ取得: 最大200件/リクエスト。期間内の全件をページングで取得する（1年で200件を超える人が普通にいるため）

## sakura-api

`sakura-api/` は VeloAva とは別の、intervals.icu プロキシ兼 MCP サーバー（PHP、さくらのレンタルサーバで稼働、claude.ai のコネクタ `sakura_icu_api`）。仕様・認証・デプロイ手順は `sakura-api/CLAUDE.md` にまとめている。Next.js のビルドには関係しない。

## デプロイ

Vercel（無料プラン対応）。環境変数4つをVercelダッシュボードで設定し、`NEXT_PUBLIC_BASE_URL` をVercelの割り当てURLに合わせる。GitHubプッシュで自動デプロイ。本番URL: https://veloava.vercel.app
