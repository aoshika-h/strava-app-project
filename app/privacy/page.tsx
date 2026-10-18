// プライバシーポリシーページ

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プライバシーポリシー — VeloAva',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-base font-bold text-white/80 mb-3 pb-2 border-b border-white/10">{title}</h2>
      <div className="text-sm text-white/55 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-2xl mx-auto px-6 pt-14 pb-20">

        {/* ヘッダー */}
        <div className="mb-10">
          <Link href="/" className="text-xs text-white/30 hover:text-white/60 transition-colors">← VeloAva トップ</Link>
          <h1 className="text-2xl font-black mt-4 mb-1">プライバシーポリシー</h1>
          <p className="text-xs text-white/30">Privacy Policy — 最終更新: 2026年10月</p>
        </div>

        {/* ===== 日本語 ===== */}
        <Section title="1. 収集する情報">
          <p>VeloAvaは、Strava APIを通じて以下の情報を取得します。</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>アスリートプロフィール（名前、性別）</li>
            <li>アクティビティデータ（距離、速度、獲得標高、パワー、説明文）</li>
            <li>一時的なアクセストークン（診断処理中のみ使用）</li>
          </ul>
          <p className="mt-2">また、Google Analytics 4により、ページビューやクリックイベント（診断開始・シェアボタン）を匿名で収集します。</p>
        </Section>

        <Section title="2. 情報の利用目的">
          <p>取得した情報は、サイクリストキャラクター診断の生成のみに使用します。マーケティング・広告・第三者への販売には一切使用しません。</p>
        </Section>

        <Section title="3. データの保存について">
          <p>VeloAvaはStravaから取得したアクティビティデータをサーバーに保存しません。診断結果はURLパラメータとしてブラウザ側にのみ存在し、セッション終了とともに消滅します。</p>
          <p>なお、前回の診断結果との比較機能のため、直近の診断結果（キャラクタータイプ・スコア・日付）をお使いのブラウザのlocalStorageに保存します。この情報はサーバーに送信されず、ブラウザ内にのみ存在します。</p>
        </Section>

        <Section title="4. 第三者サービスへのデータ送信">
          <p>以下の外部サービスにデータを送信する場合があります。</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><span className="text-white/70 font-medium">Anthropic Claude API</span> — アクティビティの説明文を送信し、性格コメントを生成します。Anthropic APIはデフォルトでユーザーデータをモデルの学習に使用しません。</li>
            <li><span className="text-white/70 font-medium">Google Analytics</span> — 匿名の利用統計（ページビュー、クリックイベント）を収集します。個人を特定する情報は含まれません。</li>
          </ul>
          <p className="mt-2">上記以外の第三者にStravaデータを提供することはありません。</p>
        </Section>

        <Section title="5. Strava APIについて">
          <p>本アプリはStravaの公式APIを使用しています。ライドデータの読み取り権限のみを使用し、データの書き込み・変更・削除は一切行いません。Stravaのプライバシーポリシーについては <span className="text-orange-400">strava.com/legal/privacy</span> をご確認ください。</p>
        </Section>

        <Section title="6. お問い合わせ">
          <p>プライバシーに関するご質問は下記メールアドレスまでお問い合わせください。</p>
          <p className="mt-2">
            <a href="mailto:veloava@aoshika.net" className="text-orange-400 hover:underline">veloava@aoshika.net</a>
          </p>
        </Section>

        {/* ===== English Summary ===== */}
        <div className="mt-14 pt-10 border-t border-white/10">
          <p className="text-xs text-white/30 mb-6 tracking-widest uppercase">English Summary</p>

          <div className="space-y-6 text-sm text-white/50 leading-relaxed">
            <div>
              <h3 className="text-white/70 font-bold mb-1">Data Collection</h3>
              <p>VeloAva accesses your Strava athlete profile (name, gender) and activity data (distance, speed, elevation, power, description) via the official Strava API. A temporary access token is used only during the analysis process. We also collect anonymous usage events via Google Analytics 4.</p>
            </div>
            <div>
              <h3 className="text-white/70 font-bold mb-1">Data Storage</h3>
              <p>VeloAva does NOT store any Strava data on our servers. Diagnosis results exist only as URL parameters in your browser and are discarded after use. Only a minimal summary of your last result (character type, scores, date) is saved in your browser&apos;s localStorage for the evolution comparison feature — this data never leaves your device.</p>
            </div>
            <div>
              <h3 className="text-white/70 font-bold mb-1">Third-Party Services</h3>
              <p>Activity descriptions may be sent to the Anthropic Claude API to generate a personality comment. Anthropic does not use API data for model training by default. Anonymous usage statistics are collected via Google Analytics. No Strava data is sold or shared with any other third party.</p>
            </div>
            <div>
              <h3 className="text-white/70 font-bold mb-1">Strava API Usage</h3>
              <p>This application uses read-only Strava API access (<code className="text-white/40">read, activity:read_all</code>). We do not write, modify, or delete any data on Strava.</p>
            </div>
            <div>
              <h3 className="text-white/70 font-bold mb-1">Contact</h3>
              <p>For privacy-related inquiries, please contact us at <a href="mailto:veloava@aoshika.net" className="text-orange-400 hover:underline">veloava@aoshika.net</a>.</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/" className="text-sm text-orange-400 hover:underline">← トップに戻る</Link>
        </div>
      </div>
    </main>
  )
}
