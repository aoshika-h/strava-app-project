# sakura-api（intervals.icu プロキシ / MCP サーバー）

VeloAva（Next.js）とは独立した PHP の API。intervals.icu の API キーを隠して、オーナー本人のトレーニングデータを読み取り専用で返す。
claude.ai のカスタムコネクタ（`sakura_icu_api`）として登録済みで、チャットの Claude から MCP ツールで呼ばれる。

- 本番: `https://aoshika.net/icu-proxy`（さくらのレンタルサーバ スタンダード、PHP 8.1 以上、`/home/aoshika-h/www/icu-proxy/`）
- コード: `public/index.php`（1 ファイル）と `public/.htaccess`。フレームワークなし
- 品質確認: `php -l public/index.php` と、モックの upstream を立てたローカル実行（`php -S`）

## 方針

- 計算は intervals.icu に任せる薄いプロキシ。intervals.icu が返す値をそのまま返し、プロキシで計算して埋めない（null は null）。例外は単位換算（J → kJ）と、ストリームの間引き（区間平均）だけ
- API キーは Basic 認証のヘッダーにだけ使い、レスポンス・ログ・エラーメッセージに出さない（`scrub_secrets()`）
- 位置情報（`latlng`、地図）は返さない
- Strava 由来のアクティビティは intervals.icu が API で詳細を返さない（Strava の規約）。id と date 以外が null になる。値が入るのは Garmin などから直接同期したもの（`source: GARMIN_CONNECT`、id は `i` から始まる）

## 認証と設定

- REST: `Authorization: Bearer {PROXY_TOKEN}`。不一致は 403
- MCP: `POST /mcp` を Bearer で、または `POST /mcp/{MCP_URL_SECRET}`（32 文字以上。URL 自体が鍵。不一致は 404）。claude.ai のコネクタは後者で登録している
- 設定ファイル: `/home/aoshika-h/icu-proxy.env`（公開ディレクトリの外、600）。キーは `ICU_API_KEY` / `ICU_ATHLETE_ID` / `PROXY_TOKEN` / `MCP_URL_SECRET` / `CORS_ALLOWED_ORIGINS` / `ICU_TIMEZONE`（既定 Asia/Tokyo）。テンプレートは `icu-proxy.env.example`
- Claude Code のクラウド環境では、環境変数 `ICU_PROXY_TOKEN` に PROXY_TOKEN が入っている（ネットワークは `aoshika.net` と `intervals.icu` を許可済み）。本番確認は `curl -H "Authorization: Bearer $ICU_PROXY_TOKEN" https://aoshika.net/icu-proxy/...`。トークンや鍵の値はチャット・コミットに出さない

## MCP ツールと REST エンドポイント

ツールと REST は同じ `fetch_*()` 関数を呼ぶ。エラーは `ApiError`（code = HTTP ステータス）を投げ、REST は `{"error":{"status","message"}}`、MCP は `isError: true` の結果に変換する。

| MCP ツール | REST | 内容 |
|---|---|---|
| `list_activities(days=7)` | `GET /activities?days=` | 直近 n 日の一覧（NP・TSS・IF・デカップリング・心拍・eFTP・kJ・ゾーン時間）。新しい順 |
| `get_activity(activity_id)` | `GET /activity/{id}`（`?raw=1` で intervals.icu の応答そのまま） | 画面相当の詳細（負荷・SS 内訳・パワー・心拍・CTL/ATL/フォーム・FTP/eFTP/W'・エネルギー・ゾーン・インターバル表） |
| `get_power_vs_hr(activity_id)` | `GET /activity/{id}/power-vs-hr` | パワー/HR（全体・前半・後半）・デカップリング・HR lag・Z2 効率 |
| `get_activity_streams(activity_id, types, resolution, start_sec, end_sec)` | `GET /activity/{id}/streams?...` | 時系列（列形式）。下記 |
| `list_wellness(days=14)` | `GET /wellness?days=` | 日別 CTL・ATL・フォーム・体重・安静時 HR・HRV・睡眠。古い順。今日を含むので n+1 日分 |
| なし | `GET /streams/{id}?types=` | intervals.icu のストリーム応答をそのまま返す |

`days` は 1〜365。「今日」は `ICU_TIMEZONE` 基準。

### get_activity_streams

- intervals.icu: `GET /api/v1/activity/{id}/streams.json?types=...`
- ストリーム名は intervals.icu のもの。既定 `time, watts, heartrate, cadence, velocity_smooth, altitude, distance`（`heart_rate` ではなく `heartrate`）。`time` は常に含める。無い種類は `missing_types` に入れる
- `time` は経過秒で、停止中は記録されない（点数 < 経過秒）。間引きは点数ではなく `time` の値で `resolution` 秒ごとに区切る
- 区間内は平均（小数 2 桁）、`time` と `distance` は区間の最後の値。null は平均から除き、全部 null なら null
- `resolution` 既定 5、`start_sec` / `end_sec` 指定時は既定 1。区間は start を含み end を含まない
- 応答が約 100KB（`STREAM_RESPONSE_BYTES_LIMIT`）を超えると resolution を上げて作り直す。実際の値が `resolution`、指定値が `requested_resolution`
- 出力: `{"activity_id","resolution","requested_resolution","start_sec","end_sec","n","missing_types","streams":{"time":[...],"watts":[...],...}}`

### 単位

距離 m、時間 秒、速度 m/s、勾配は比率（0.05 = 5%）、kJ（`kj`・`kj_above_ftp`・`max_wbal_depletion_kj` は J から換算済み）、intensity は %。

## 検証用の基準データ

アクティビティ `i209803206`（2026-11-14 平塚ライド、Garmin）。FIT ファイルの値と一致を確認済み。

- 1 秒ごとの点数 18,888、経過 27,483 秒、最大 HR 186、最大パワー 860W、距離 142,665.84m
- 20 分ベスト 231.8W（経過 19,052〜20,252 秒、90.2km → 100.9km）
- streams: `resolution=10` 全体で 81.0KB・1,973 点。`start_sec=19052&end_sec=20852`（30 分）で 62.6KB・1,761 点・resolution 1。既定（5）の全体は 100KB を超えて 9 に上がる

## デプロイ

- オーナーの Windows のリポジトリ（`strava-api`。中身は `public/` だけ）から `git push origin master` → さくらのベアリポジトリ（`~/git/icu-proxy.git`）の `post-receive` が `public/` を `~/www/icu-proxy/` に展開する。Claude からはさくらへ直接 push できない（クラウド環境は SSH 不可）ので、変更後は `public/index.php` をファイルで渡してオーナーに push してもらう
- 代替として `deploy/pull-deploy.sh`（さくらの CRON で GitHub から取得して展開）を用意してあるが、運用は未確定。両方から展開すると上書きし合うので併用しない
- 展開後は `curl` で本番の応答を確かめる。claude.ai のコネクタに新しいツールが出ないときは再接続してもらう

## さくらの注意点

- ログインシェルは csh。`$(...)` が使えないのでバッククォートを使う。`sed -i ''`（FreeBSD）
- Windows で作ったシェルスクリプトは CRLF だと動かない（`.gitattributes` で LF 固定）
- HTTPS リダイレクトは `.htaccess` に入れない（このサーバでは `X-Sakura-Forwarded-For` が来ず、内部リライト後に誤ってリダイレクトする）
- `Authorization` ヘッダーは `.htaccess` で `HTTP_AUTHORIZATION` に詰め替えている（CGI 版 PHP 対策）
- claude.ai からの接続は海外 IP なので、さくらの「国外IPアドレスフィルタ」は無効にしておく
