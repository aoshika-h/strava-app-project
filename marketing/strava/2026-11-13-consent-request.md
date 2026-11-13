# Strava への問い合わせメール（下書き）

- 宛先: developers@strava.com
- 送信者: veloava@aoshika.net
- 送る前に埋める: 【Client ID】（https://www.strava.com/settings/api に表示）

---

**Subject:** Request for consent to announce VeloAva / questions about sharing (Client ID: 【Client ID】)

Hello Strava Developer Team,

Thank you for approving VeloAva for the production rate limits last week.

VeloAva is a small web app that I develop personally. It reads a user's own rides through the Strava API and shows the user a "cyclist type" character (6 types) based on their own data.
https://veloava.vercel.app

Before introducing the app to other riders, I would like to ask for your consent and confirm some points of the Strava API Policy.

1. Announcement (Section 4.6)
I would like to post about VeloAva on X and on my own Strava account. The post would say that the app uses Strava ride data, for example: "I made a web app that shows your cyclist type from your Strava rides." The post will not use the Strava logo and will not say the app is official or endorsed by Strava.
May I have your written consent for this kind of post?

2. Users sharing their own result (Section 6.2)
On the result page, the user can share an image of their character by their own action (share button). The image and the shared link contain only the character type (for example "Climber") and the character illustration. They do not contain the user's name, profile photo, activity data, or scores.
Is this kind of user-initiated sharing allowed?

3. Saving the last result in the user's browser (Section 6.2)
To show "how your type changed since last time", VeloAva saves only the character type, five scores (0-100) and the date in the user's own browser (localStorage). This is not sent to our server, and we do not store any Strava Data on our server.
Is this allowed beyond seven days, or should we delete it after seven days?

4. Usage counting (Section 5.4)
We use Google Analytics to count button clicks. The share event currently includes the character type. Can we keep this, or should we remove the character type and count only the clicks?

If any of these points is not allowed, I will change the app accordingly.

Thank you for your time.

Best regards,
Hideyuki Aoshika
VeloAva
veloava@aoshika.net

---

## 日本語訳（確認用）

件名：VeloAva の告知への同意のお願いと、シェアについての質問（Client ID: 【Client ID】）

先週は VeloAva の本番利用を承認いただきありがとうございました。

VeloAva は個人で開発している小さなWebアプリで、Strava API でユーザー本人のライドを読み込み、本人のデータからサイクリストタイプ（6種類のキャラクター）を表示します。

他のライダーに紹介する前に、同意のお願いと Strava API Policy についての確認をさせてください。

1. 告知（4.6条）
X と自分の Strava アカウントで VeloAva を紹介したいです。投稿には「Strava のライドからサイクリストタイプがわかるWebアプリを作った」のように、Strava のデータを使っていることを書きます。Strava のロゴは使わず、公式・推奨とも書きません。この投稿について書面で同意をいただけますか。

2. ユーザー本人による結果のシェア（6.2条）
結果ページでは、ユーザーが自分でボタンを押してキャラ画像をシェアできます。画像とリンクに含まれるのはキャラのタイプとイラストだけで、名前・プロフィール写真・アクティビティデータ・スコアは含みません。このような本人によるシェアは許可されますか。

3. 前回の結果をブラウザに保存すること（6.2条）
「前回からのタイプの変化」を表示するため、キャラのタイプ・5つのスコア（0〜100）・日付だけをユーザー本人のブラウザ（localStorage）に保存しています。サーバーには送らず、Strava のデータをサーバーに保存することもありません。7日を超えて保存してよいか、7日で消すべきか教えてください。

4. 利用数の計測（5.4条）
Google Analytics でボタンのクリック数を数えています。シェアのイベントに現在キャラのタイプを含めていますが、このままでよいか、タイプを外してクリック数だけにすべきか教えてください。

許可されない点があれば、アプリ側で対応します。

---

## メモ

- AIコメント機能（5.3条）はすでに削除済みなので、このメールでは触れていない
- 返事が来るまでは、X の告知で「Strava」という言葉を出さない形にしておくと安全（例:「ライドデータからサイクリストタイプを診断するアプリ作った」）
