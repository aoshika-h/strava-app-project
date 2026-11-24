# FV用 12体集合画像 生成プロンプト

トップページのファーストビュー（タイトル「VeloAva」の下、または背景）に置く、12キャラの集合絵。設定は `marketing/world/characters.md` に合わせている。

## 生成のコツ

- **今の12枚の画像を参照画像として必ず渡す**（`public/characters/*_male.png` と `*_female.png`）。文字だけで12体の見た目を再現するのは難しく、既存キャラと別人になりやすい
- 12体を1回で正確に出すのは画像生成AIの苦手分野。うまくいかなければ「6体ずつ2枚」または「キャラごとに出してから合成」に切り替える
- 文字・ロゴは画像に入れない（タイトルはページ側のHTMLで出す。Stravaのロゴも入れない）
- 背景はページの背景色 `#0A0A0F` に溶け込む暗さにする。端がページとつながって見えるように

## サイズ

| 用途 | 比率 | サイズ目安 |
|---|---|---|
| PC | 16:9 | 1920×1080 |
| スマホ | 4:5 | 1080×1350（PC版と別に生成するか、PC版の中央を切り出す） |

PC版だけ作る場合は、中央の6体（オールラウンダー、クライマー、スプリンター）がスマホで切り出しても収まるように配置する。

## 構図

- 12体がこちらに向かって走ってくる、V字（逆三角形）の隊列。先頭の中央にオールラウンダーの2人
- 同じタイプの男女は隣どうしに並べる
- 左から: グランフォンド／クライマー／オールラウンダー（中央・先頭）／スプリンター／タイムトライアリスト／サンデーライダー
- 背景は左から右へ地形が変わる: 山の稜線（左）→ 夜明け前の道（中央）→ 海沿いの地平線（右）
- 各キャラの足元や周りにタイプ色の光のエフェクト。全体の光はVeloAvaのオレンジ（#FC4C02）を基調に

---

## プロンプト（英語・そのまま貼る用）

```
Wide 16:9 hero illustration for a cycling app, no text, no logos.

Twelve chibi-proportioned armored mecha cyclists riding road bikes toward the viewer in a V-shaped formation, dynamic and heroic. Each character wears full robotic armor with a helmet visor that hides the face; only the eyes glow in the character's theme color. Anime game-art style, clean thick line art, cel shading with glossy metal highlights, glowing neon accents. Keep each character's design faithful to the attached reference images.

Six teams, each a male and female pair riding side by side in matching colors:

1. Orange team (#FC4C02), front center, leading the formation:
   - Male: orange armor, vented road helmet, target emblem on chest, one fist raised.
   - Female: orange and white helmet, long brown ponytail, target emblem on chest.
2. Green team (#10B981), left of center:
   - Male: green armor, helmet crest shaped like jagged mountain peaks, water bottle on back.
   - Female: green armor, crown of small white edelweiss flowers, long flowing green hair.
3. Yellow team (#F59E0B), right of center:
   - Male: yellow armor, spiky lightning-bolt helmet, crackling yellow lightning around him.
   - Female: yellow armor, lightning-bolt crest, golden ponytail, yellow lightning trails.
4. Purple team (#8B5CF6), far left:
   - Male: purple armor, bucket hat with a small antenna, huge backpack with bedroll, compass pendant.
   - Female: purple armor and visor helmet, long flowing purple scarf like a cape, bottles on her back.
5. Blue team (#3B82F6), far right:
   - Male: blue armor, round aero time-trial helmet with blue visor, gear emblem on chest.
   - Female: sleek blue aero helmet, long blue hair streaming back, blue speed lines.
6. Pink team (#EC4899), outer right edge, relaxed and cheerful:
   - Male: pink armor, sun visor cap over helmet, front basket with a water bottle, peace sign.
   - Female: pink armor and visor helmet, pink twin tails, frilly skirt armor, peace sign.

Background: very dark navy-black (#0A0A0F) fading to pure dark at the edges so it blends into a dark web page. Behind the riders the landscape changes from left to right: silhouetted mountain ridges on the left, an open road at pre-dawn in the center, a coastal horizon on the right. A soft orange glow rises behind the front center riders. Each rider leaves a light trail in their own theme color.

Composition: all twelve characters fully visible, none cropped, evenly lit. The central six (orange, green, yellow teams) fit inside the middle 60% of the width.
```

## ネガティブプロンプト（使えるツールの場合）

```
text, letters, logo, watermark, Strava logo, realistic human faces, visible faces, cropped characters, extra limbs, merged bikes, duplicated characters, blurry, low contrast, bright white background
```

## 日本語での要点（日本語で指示するツール用）

```
自転車アプリのトップ画像。横長16:9、文字とロゴは入れない。
メカのアーマーを着た2〜3頭身のデフォルメのロードバイク乗り12体が、V字の隊列でこちらへ走ってくる。顔はバイザーで隠れ、目だけがチームの色に光る。アニメ調のゲームイラスト、太めの線、金属の光沢、ネオンの発光。添付の参照画像のキャラデザインに忠実に。
6チームが男女ペアで並ぶ。中央先頭がオレンジ、その左に緑、右に黄、左端に紫、右に青、右端にピンク（各キャラの特徴は英語版のとおり）。
背景は #0A0A0F の濃紺に近い黒で、端ほど暗くしてWebページに溶け込ませる。左は山の稜線、中央は夜明け前の道、右は海沿いの地平線。中央の後ろからオレンジの光。
12体とも見切れず全身が見えるように。
```

## できた画像を入れるとき

- 置き場所: `public/hero/group.webp`（PCとスマホで分けるなら `group-wide.webp` / `group-tall.webp`）
- 表示: トップページ（`app/[lang]/page.tsx`）のタイトルの下に `next/image` で入れ、`priority` を付ける（FVなので遅延読み込みしない）
- 重さ: FVの表示速度に効くので、WebPで300KB前後に抑える
