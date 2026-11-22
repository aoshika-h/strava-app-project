// プライバシーポリシーの本文（英語）。ja.tsx の 1〜6 と同じ内容にそろえる
// データの扱いを変えたら ja.tsx・pt.tsx と一緒に直す

import Section from './Section'

export default function PrivacyEn() {
  return (
    <>
      <Section title="1. Information we collect">
        <p>VeloAva obtains the following information through the Strava API:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Athlete profile (name, sex)</li>
          <li>Activity data (distance, speed, elevation gain, power)</li>
          <li>A temporary access token (used only while the diagnosis runs; VeloAva disconnects from Strava right after the diagnosis)</li>
        </ul>
        <p className="mt-2">We also collect anonymous page views and click events (diagnosis start, share buttons) with Google Analytics 4.</p>
      </Section>

      <Section title="2. How we use the information">
        <p>The information is used only to generate your cyclist character diagnosis. It is never used for marketing or advertising, and never sold to third parties.</p>
      </Section>

      <Section title="3. Data storage">
        <p>VeloAva does not store activity data obtained from Strava on its servers. Your diagnosis result exists only as a URL parameter in your browser and disappears when you close it.</p>
        <p>To compare with your previous diagnosis, your latest result for each analysis period (character type, scores, period and date) is saved in your browser&apos;s localStorage. This information is never sent to a server and stays in your browser. The type you guess before the diagnosis is also stored in your browser temporarily for the reveal, and deleted once the result is shown. If you choose a display language at the top of the page, that language is saved in a cookie (veloava_locale) for one year.</p>
      </Section>

      <Section title="4. Data sent to third-party services">
        <p>We send data to the following external service:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><span className="text-white/70 font-medium">Google Analytics</span> — collects anonymous usage statistics (page views, click events and the type you guessed before the diagnosis). It contains no personally identifiable information and no Strava data.</li>
        </ul>
        <p className="mt-2">Data obtained from Strava is never provided to any third party, including AI services.</p>
      </Section>

      <Section title="5. About the Strava API">
        <p>VeloAva uses the official Strava API. It only uses permission to read public and followers-only activities (activities set to “Only You” are read only if you choose “Include rides set to ‘Only You’” before the diagnosis), and never writes, changes or deletes any data. For Strava&apos;s privacy policy, see <span className="text-orange-400">strava.com/legal/privacy</span>.</p>
      </Section>

      <Section title="6. Contact">
        <p>For privacy-related questions, please contact us at the email address below.</p>
        <p className="mt-2">
          <a href="mailto:veloava@aoshika.net" data-ga-event="ui_click" data-ga-id="contact_mail" className="text-orange-400 hover:underline">veloava@aoshika.net</a>
        </p>
      </Section>
    </>
  )
}
