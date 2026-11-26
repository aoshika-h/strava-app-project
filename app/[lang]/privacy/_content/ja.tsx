// プライバシーポリシーの本文（日本語）。英語の要約も下に残している（Strava の審査や英語圏の人が読めるように）
// 見出しの部品 Section は ./Section.tsx。英語・ポルトガル語の本文は en.tsx・pt.tsx（内容は同じにそろえる）
// 計測やデータの扱いを変えたら、3言語とも合わせて直す

import Section from './Section'

export default function PrivacyJa() {
  return (
    <>
      {/* ===== 日本語 ===== */}
      <Section title="1. 収集する情報">
        <p>VeloAvaは、Strava APIを通じて以下の情報を取得します。</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>アスリートプロフィール（名前、性別）</li>
          <li>アクティビティデータ（距離、速度、獲得標高、パワー）</li>
          <li>一時的なアクセストークン（診断処理中のみ使用し、診断後すぐにStravaとの連携を解除します）</li>
        </ul>
        <p className="mt-2">また、Google Analytics 4により、ページビューやクリックイベント（診断開始・シェアボタン）を匿名で収集します。</p>
      </Section>

      <Section title="2. 情報の利用目的">
        <p>取得した情報は、サイクリストキャラクター診断の生成のみに使用します。マーケティング・広告・第三者への販売には一切使用しません。</p>
      </Section>

      <Section title="3. データの保存について">
        <p>VeloAvaはStravaから取得したアクティビティデータをサーバーに保存しません。診断結果はURLパラメータとしてブラウザ側にのみ存在し、セッション終了とともに消滅します。</p>
        <p>なお、前回の診断結果との比較機能のため、分析期間ごとの直近の診断結果（キャラクタータイプ・スコア・分析期間・日付）をお使いのブラウザのlocalStorageに保存します。この情報はサーバーに送信されず、ブラウザ内にのみ存在します。診断前に選んだ「予想タイプ」も答え合わせのため一時的にブラウザに保存し、結果の表示後に削除します。画面上部で表示言語を選んだ場合は、その言語をCookie（veloava_locale）に1年間保存します。</p>
      </Section>

      <Section title="4. 第三者サービスへのデータ送信">
        <p>以下の外部サービスにデータを送信します。</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><span className="text-white/70 font-medium">Google Analytics</span> — 匿名の利用統計（ページビュー、クリックイベント、診断前に選んだ予想タイプ）を収集します。個人を特定する情報やStravaのデータは含まれません。</li>
        </ul>
        <p className="mt-2">Stravaから取得したデータを第三者（AIサービスを含む）に提供することはありません。</p>
      </Section>

      <Section title="5. Strava APIについて">
        <p>本アプリはStravaの公式APIを使用しています。公開・フォロワー限定のアクティビティの読み取り権限のみを使用し（「自分のみ」に設定した非公開アクティビティは、診断画面で「自分のみに設定したライドも含める」を選んだ場合だけ読み取ります）、データの書き込み・変更・削除は一切行いません。Stravaのプライバシーポリシーについては <span className="text-orange-400">strava.com/legal/privacy</span> をご確認ください。</p>
      </Section>

      <Section title="6. お問い合わせ">
        <p>プライバシーに関するご質問は下記メールアドレスまでお問い合わせください。</p>
        <p className="mt-2">
          <a href="mailto:veloava@aoshika.net" data-ga-event="ui_click" data-ga-id="contact_mail" className="text-orange-400 hover:underline">veloava@aoshika.net</a>
        </p>
      </Section>

      {/* ===== English Summary ===== */}
      <div className="mt-14 pt-10 border-t border-white/10">
        <p className="text-xs text-white/55 mb-6 tracking-widest uppercase">English Summary</p>

        <div className="space-y-6 text-sm text-white/55 leading-relaxed">
          <div>
            <h3 className="text-white/70 font-bold mb-1">Data Collection</h3>
            <p>VeloAva accesses your Strava athlete profile (name, gender) and activity data (distance, speed, elevation, power) via the official Strava API. A temporary access token is used only during the analysis process, and VeloAva revokes its access to your Strava account right after the diagnosis. We also collect anonymous usage events via Google Analytics 4.</p>
          </div>
          <div>
            <h3 className="text-white/70 font-bold mb-1">Data Storage</h3>
            <p>VeloAva does NOT store any Strava data on our servers. Diagnosis results exist only as URL parameters in your browser and are discarded after use. Only a minimal summary of your last result for each analysis period (character type, scores, period, date) is saved in your browser&apos;s localStorage for the evolution comparison feature — this data never leaves your device.</p>
          </div>
          <div>
            <h3 className="text-white/70 font-bold mb-1">Third-Party Services</h3>
            <p>Anonymous usage statistics (page views, clicks, and the type you guessed before the diagnosis) are collected via Google Analytics; they contain no Strava data. No Strava data is sold or shared with any third party, including AI services.</p>
          </div>
          <div>
            <h3 className="text-white/70 font-bold mb-1">Strava API Usage</h3>
            <p>This application uses read-only Strava API access (<code className="text-white/55">read, activity:read</code>). Activities you set to “Only You” are read only if you choose to include them before the diagnosis (<code className="text-white/55">activity:read_all</code>). We do not write, modify, or delete any data on Strava.</p>
          </div>
          <div>
            <h3 className="text-white/70 font-bold mb-1">Contact</h3>
            <p>For privacy-related inquiries, please contact us at <a href="mailto:veloava@aoshika.net" data-ga-event="ui_click" data-ga-id="contact_mail" className="text-orange-400 hover:underline">veloava@aoshika.net</a>.</p>
          </div>
        </div>
      </div>
    </>
  )
}
