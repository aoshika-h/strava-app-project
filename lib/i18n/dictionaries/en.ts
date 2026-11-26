// 画面に出る文言（英語）。形は ja.ts と同じ（Dictionary 型を付けているので、キーの過不足があると型エラーになる）
// 英語圏・その他の言語の人向け。Strava のアプリ内表記（"Only You" など）に合わせている

import type { Dictionary } from './ja'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const en: Dictionary = {
  htmlLang: 'en',
  ogLocale: 'en_US',
  langName: 'English',
  numberLocale: 'en-US',
  meta: {
    title: 'VeloAva — Discover your cyclist character',
    description: 'VeloAva analyzes your Strava rides and reveals your cyclist avatar',
  },
  home: {
    badge: 'Strava ride analysis',
    titleLine1: 'Discover your',
    titleLine2: 'cyclist character',
    lead: 'VeloAva analyzes your Strava rides and matches your riding style to one of 6 characters — based on power, riding style, frequency and elevation.',
    errors: {
      access_denied: 'Strava access was declined. Please try again.',
      no_code: 'We could not get an authorization code. Please try again.',
      analysis_failed: 'Something went wrong while analyzing your data. Please try again later.',
      athlete_limit: 'The app has reached its user limit (999 athletes). It is not available right now.',
    } as Record<string, string>,
    trust: [
      'Your ride data is never stored on our servers',
      'VeloAva disconnects from Strava automatically after the diagnosis (you can check it is gone under Strava "Settings → My Apps")',
      'Read-only. We never post or change anything. Activities set to "Only You" are read only if you tick the box',
    ],
    readPrivacy: 'Read the privacy policy',
    typesTitle: '6 cyclist types',
    howTitle: 'How it works',
    how: [
      { title: 'Connect Strava', desc: 'Connect your Strava account in one click, using secure OAuth.' },
      { title: 'Ride analysis', desc: 'Your rides from the period you choose (3 months, 6 months or 1 year) — distance, elevation, speed and power — are analyzed automatically.' },
      { title: 'Meet your character', desc: 'Your riding patterns are matched to one of 6 cyclist characters.' },
    ],
    changelogTitle: 'Updates',
    showAll: (n: number) => `Show all (${n})`,
    footerNote: 'Strava data is used only for the analysis — never stored or shared',
    privacy: 'Privacy policy',
  },
  starter: {
    step1: '① Which type do you think you are?',
    unknown: "Not sure / skip the guess",
    step2: '② Pick a period and start!',
    yourGuess: 'Your guess: ',
    includePrivate: 'Include rides set to "Only You"',
    includePrivateNote: 'For riders who keep indoor sessions private. Strava will also ask permission to read your private activities',
  },
  periods: { '90': '3 months', '180': '6 months', '365': '1 year' } as Record<string, string>,
  loading: {
    title: 'Connecting to Strava',
    body1: 'Taking you to the authorization page',
    body2: 'Please wait a moment',
    period: 'Period: ',
  },
  result: {
    preview: '⚡ PREVIEW MODE — test display',
    totalDistance: 'Total distance',
    avgDistance: 'Avg distance',
    avgSpeed: 'Avg speed',
    totalElevation: 'Total elevation',
    climbingRatio: 'Climbing ratio',
    ridingDays: 'Riding days',
    avgPower: 'Avg power',
    indoorTag: ' (indoor)',
    outdoorTag: ' (outdoor)',
    daysPerWeek: (n: string) => `${n} days/week`,
    retry: '← Try again',
    errorMissing: 'No diagnosis data found',
    errorInvalid: 'Could not load the data',
    backToTop: 'Back to top',
    tryAgain: 'Try again',
  },
  evolution: {
    evolved: 'Evolved!',
    keeping: (name: string) => `Still ${name}`,
    period: (days: number) => (days >= 365 ? '1-year' : `${Math.round(days / 30)}-month`),
    previous: (period: string, date: string) => `Previous ${period} diagnosis: ${date}`,
  },
  reveal: {
    yourGuess: 'Your guess',
    result: 'Result',
    hit: 'Spot on! You know your riding well',
    miss: 'A surprising side of you — this is what your data saw',
  },
  share: {
    postBeforeLogo: 'Post on',
    postAfterLogo: '',
    saving: '⏳ Processing...',
    saveMobile: '📲 Save / Share',
    saveDesktop: '💾 Download image',
    shareTitle: 'VeloAva cyclist character',
    postText: (name: string, title: string) =>
      `VeloAva says my cyclist type is "${name}" (${title})!\nWhat's yours?\n#VeloAva #cycling #roadcycling`,
  },
  sharePage: {
    metaTitle: (name: string) => `My cyclist type is "${name}" — VeloAva`,
    metaDescription: 'Find out which of 6 cyclist characters matches your Strava rides.',
    cta: 'Find your type →',
    note: 'Connect Strava — results in 30 seconds',
  },
  og: {
    alt: 'VeloAva — Cyclist character diagnosis',
    lead: 'My cyclist type is',
    cta: "What's yours?",
  },
  notFound: {
    title: 'Page not found',
    body: 'The URL may be wrong, or the page may have moved.',
    backTop: 'Back to the top and get diagnosed',
  },
  privacy: {
    metaTitle: 'Privacy Policy — VeloAva',
    title: 'Privacy Policy',
    updated: 'Last updated: November 2026',
    backTop: '← VeloAva home',
    backBottom: '← Back to top',
  },
  axes: { climbing: 'Climbing', speed: 'Speed', endurance: 'Endurance', power: 'Power', consistency: 'Consistency' },
  // 日付の表示。toLocaleDateString は言語に合わせた書き方にしてくれる（Nov 22, 2026）
  formatDate: (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  // 'YYYY-MM-DD' は new Date に渡すと UTC 扱いで日付がずれることがあるので、文字列を分けて組み立てる
  formatShortDate: (ymd: string) => {
    const [, m, d] = ymd.split('-')
    return `${MONTHS[Number(m) - 1]} ${Number(d)}`
  },
}
