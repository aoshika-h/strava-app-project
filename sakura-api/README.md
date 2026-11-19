# intervals.icu API プロキシ（さくらのレンタルサーバ用）

intervals.icu の API キーをクライアントに渡さずにトレーニングデータを取得するための薄い PHP プロキシ。
計算は intervals.icu に任せ、ここでは認証を隠して必要なフィールドを抜き出すだけ。Next.js アプリ（Vercel）とは独立して動く。

- PHP 8.1 以上（さくらのコントロールパネルで選択）・curl 拡張
- フレームワーク・Composer 不要（`index.php` 1ファイル + `.htaccess`）

## 設置手順

1. **PHP バージョン**: コントロールパネル → スクリプト設定で PHP 8.1 以上を選ぶ。
2. **ファイル配置**: `public/` の中身（`index.php` と `.htaccess`）を公開ディレクトリにアップロードする。

   ```
   ~/www/icu-proxy/index.php
   ~/www/icu-proxy/.htaccess
   ```

3. **設定ファイル**: `icu-proxy.env.example` をコピーして **公開ディレクトリの外** に置き、値を入れる。

   ```
   ~/icu-proxy.env      # ドキュメントルート(~/www)の親ディレクトリ
   chmod 600 ~/icu-proxy.env
   ```

   既定ではドキュメントルートの親にある `icu-proxy.env` を読む。別の場所に置く場合は、環境変数 `ICU_PROXY_ENV_FILE` でパスを指定する。
   各値は環境変数が設定されていればそちらが優先される。

4. **SSL**: コントロールパネルで SSL を有効にする。HTTPS へのリダイレクトはしないので、クライアントは必ず `https://` で呼ぶこと。

| 変数 | 必須 | 内容 |
|------|------|------|
| `ICU_API_KEY` | ◯ | intervals.icu → Settings → Developer Settings の API キー |
| `ICU_ATHLETE_ID` | ◯ | アスリートID（例: `i12345`） |
| `PROXY_TOKEN` | ◯ | クライアント認証用の固定トークン（`openssl rand -hex 32` などで生成） |
| `CORS_ALLOWED_ORIGINS` | | ブラウザから直接呼ぶ場合に許可するオリジン（カンマ区切り）。空なら CORS 無効 |
| `ICU_TIMEZONE` | | `days` の基準日を決めるタイムゾーン（既定 `Asia/Tokyo`） |

## git push でデプロイする

さくら側にベアリポジトリを作り、`main` がプッシュされたら `sakura-api/public` の中身だけを `~/www/icu-proxy/` に展開する（`deploy/post-receive`）。Next.js アプリなど他のファイルは公開ディレクトリに出ない。

### 初回セットアップ（1回だけ）

1. **SSH 鍵の登録**（Windows の PowerShell）

   ```powershell
   ssh-keygen -t ed25519            # 鍵がなければ作成（~/.ssh/id_ed25519.pub）
   type $env:USERPROFILE\.ssh\id_ed25519.pub
   ```

   表示された公開鍵を、さくらにパスワードで SSH ログインして `~/.ssh/authorized_keys` に追記する。

   ```sh
   ssh <アカウント名>@<アカウント名>.sakura.ne.jp
   mkdir -p ~/.ssh && chmod 700 ~/.ssh
   echo '<公開鍵の1行>' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys
   ```

2. **さくら側にベアリポジトリとフックを作る**（さくらに SSH ログインした状態で）

   ```sh
   mkdir -p ~/git && git init --bare ~/git/icu-proxy.git
   vi ~/git/icu-proxy.git/hooks/post-receive   # deploy/post-receive の中身を貼り付ける
   chmod +x ~/git/icu-proxy.git/hooks/post-receive
   ```

   展開先やブランチを変える場合は、フック先頭の `DEPLOY_DIR` / `DEPLOY_BRANCH` を編集する。

3. **設定ファイル**は上の手順 3 のとおり `~/icu-proxy.env` を手で置く（リポジトリには含めない）。

4. **ローカルにリモートを追加**（Windows のリポジトリのフォルダで）

   ```powershell
   git remote add sakura <アカウント名>@<アカウント名>.sakura.ne.jp:git/icu-proxy.git
   ```

### デプロイ

```powershell
git push sakura main
```

`remote: deploy: sakura-api/public (...) -> /home/<アカウント名>/www/icu-proxy` と表示されれば反映済み。
`main` 以外のブランチを試しに出したいときは `git push sakura <ブランチ名>:main`。

- `git-receive-pack: command not found` になる場合は、`git config remote.sakura.receivepack /usr/local/bin/git-receive-pack` を実行する。
- リポジトリから消したファイルは公開ディレクトリからは自動で消えない。不要になったファイルは手で削除する。

## 認証

全エンドポイントで `Authorization: Bearer {PROXY_TOKEN}` ヘッダーが必要。トークンが一致しなければ `403` を返す。

```bash
curl -H "Authorization: Bearer $PROXY_TOKEN" "https://example.sakura.ne.jp/icu-proxy/activities?days=7"
```

## エンドポイント

### `GET /activities?days={n}`（既定 7）

`/athlete/{id}/activities?oldest=今日-n日&newest=今日` の結果から、以下のフィールドだけを返す。値がない・未計算のフィールドは `null`（`decoupling`・`eftp` はプロキシ側で計算して埋めない）。

| キー | intervals.icu のフィールド |
|------|----------------------|
| `id` | `id` |
| `date` | `start_date_local` の日付部分 |
| `name` / `type` | `name` / `type` |
| `moving_time` | `moving_time`（秒） |
| `distance` | `distance`（m） |
| `elevation` | `total_elevation_gain` |
| `ftp` | `icu_ftp` |
| `avg_power` / `np` | `icu_average_watts` / `icu_weighted_avg_watts` |
| `intensity` / `tss` | `icu_intensity` / `icu_training_load` |
| `avg_hr` / `max_hr` | `average_heartrate` / `max_heartrate` |
| `cadence` | `average_cadence` |
| `decoupling` | `decoupling` |
| `pw_hr` | `icu_power_hr` |
| `eftp` | `icu_rolling_ftp` |
| `kj` | `icu_joules`（J → kJ に変換） |
| `zone_times` | `icu_zone_times` |
| `description` | `description` |

> Strava 経由で intervals.icu に取り込まれたアクティビティは、Strava の API 規約により intervals.icu の API から詳細が返らない（`id` 以外がほぼ `null` になる）。Garmin・Wahoo などから直接同期したアクティビティを使うこと。

### `GET /wellness?days={n}`（既定 14）

`/athlete/{id}/wellness` から `date, ctl, atl, form, weight, resting_hr, hrv, sleep_secs` を返す。
`form` は intervals.icu の `form` フィールドがあればその値、なければ `ctl - atl`。`hrv`・`sleep_secs` などは未入力なら `null`。

### `GET /activity/{activity_id}`

intervals.icu のアクティビティ画面に相当するデータ（サマリー・負荷・パワー・心拍・フィットネス・エネルギー・ゾーン・インターバル表）を返す。内部では `/activity/{id}?intervals=true` を呼ぶ。
`?raw=1` を付けると intervals.icu の応答をそのまま返す（フィールド名の確認用）。値がないフィールドは `null`。

### `GET /activity/{activity_id}/power-vs-hr`

パワー/心拍数の分析値（パワー/心拍数・前半/後半・デカップリング・HR lag・パワー/HR Z2 など）を返す。グラフ用のデータは返さない。

### `GET /activity/{activity_id}/streams?types=&resolution=&start_sec=&end_sec=`

分析用の時系列データを列形式で返す（MCP ツール `get_activity_streams` と同じ）。

- `types`: 既定 `time,watts,heartrate,cadence,velocity_smooth,altitude,distance`（intervals.icu のストリーム名）。`time` は常に含む。`latlng` は返さない
- `resolution`: 何秒ごとに間引くか（既定 5。`start_sec` / `end_sec` を指定したときは既定 1）。区間内の平均をとり、`time`・`distance` は区間の最後の値。null は null のまま
- `start_sec` / `end_sec`: 経過秒で区間を指定（start を含み end を含まない）
- 応答が約 100KB を超えるときは `resolution` を自動で上げる。実際の値は `resolution`、指定値は `requested_resolution`

```json
{"activity_id":"i209803206","resolution":10,"requested_resolution":10,"start_sec":0,"end_sec":27483,"n":1973,
 "missing_types":[],"streams":{"time":[...],"watts":[...],"heartrate":[...]}}
```

### `GET /streams/{activity_id}?types={csv}`

`/activity/{activity_id}/streams?types=...` のレスポンスをそのまま返す（生ストリーム）。`types` の既定は `time,watts,heartrate,cadence`。データ量が大きいので、必要なときだけ呼ぶこと（クライアントが `Accept-Encoding: gzip` を送れば gzip 圧縮で返る）。

`days` は 1〜365 の整数。範囲外なら `400`。

### `POST /mcp`（MCP サーバー）

claude.ai などの MCP クライアントから使うための MCP サーバー（Streamable HTTP、JSON 応答）。ツールは `list_activities`・`get_activity`・`get_power_vs_hr`・`list_wellness` で、中身は上の各エンドポイントと同じ。

- `Authorization: Bearer {PROXY_TOKEN}` を送れるクライアントは `https://<ドメイン>/icu-proxy/mcp`
- ヘッダーを設定できないクライアントは、`MCP_URL_SECRET`（32 文字以上）を設定して `https://<ドメイン>/icu-proxy/mcp/{MCP_URL_SECRET}`。URL を知っていれば誰でも使えるので、URL は他人に教えないこと

claude.ai での登録: カスタマイズ → コネクタ → カスタムコネクタを追加 → 上の URL を入力し、認証は「No sign-in」。

## エラー

```json
{ "error": { "status": 404, "message": "..." } }
```

- intervals.icu が 4xx/5xx を返した場合、そのステータスとメッセージを返す（API キーはメッセージから除去）。
- 接続失敗は `502`、タイムアウトは `504`。
- intervals.icu への接続タイムアウトは 5 秒、全体は 20 秒（streams は 40 秒）。接続失敗・429・5xx は最大 2 回リトライする。

## 注意

- 403 が想定外に返る場合は、さくらの WAF が誤検知している可能性がある。コントロールパネルの WAF ログを確認し、必要なら除外設定をする。
- API キーをレスポンスやログに出さないようにしている。`error_log` に出るのは curl のエラー番号とパスだけ。
