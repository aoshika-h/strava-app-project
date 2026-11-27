// 画面に出る文言（日本語）。英語・ポルトガル語の辞書はこれと同じ形にする（Dictionary 型で揃っているか型チェックされる）
// 呼び出し元: getDictionary(locale) 経由で各ページ・部品。文字だけのデータなのでサーバーでもブラウザでも動く
// 数や名前が入る文言は関数にしている（言語によって語順が違うため、文字列の連結ではなく文ごと訳せるように）

export const ja = {
  htmlLang: 'ja',
  ogLocale: 'ja_JP', // OGP の og:locale（言語_国）
  langName: '日本語',
  numberLocale: 'ja-JP', // 数値の書式（toLocaleString に渡す。ポルトガル語なら 1.234,5 のようになる）
  meta: {
    title: 'VeloAva — あなたのサイクリストキャラクターを診断',
    description: 'Stravaのライドデータを分析して、あなたのサイクリストアバターを診断します',
  },
  home: {
    badge: 'Stravaデータ分析',
    titleLine1: 'あなたのサイクリスト',
    titleLine2: 'キャラクターを診断',
    lead: 'Stravaのライドデータを分析して、あなたの走りのタイプを6種類のキャラクターから診断します。FTP・脚質・頻度・獲得標高をもとに判定。',
    errors: {
      access_denied: 'Stravaの連携を拒否されました。もう一度試してください。',
      no_code: '認証コードが取得できませんでした。もう一度試してください。',
      analysis_failed: 'データの分析中にエラーが発生しました。しばらくしてから再度お試しください。',
      athlete_limit: 'アプリの利用者数が上限（999人）に達しています。現在アクセスできません。',
    } as Record<string, string>,
    trust: [
      'ライドデータはサーバーに保存しません',
      '診断が終わると Strava との連携を自動で解除します（Stravaの「設定 → 連携アプリ」から消えていることを確認できます）',
      '読み取りのみ。投稿・変更は一切しません。「自分のみ」にしている非公開アクティビティは、チェックを入れたときだけ読みます',
    ],
    readPrivacy: 'プライバシーポリシーを読む',
    typesTitle: '6種類のサイクリストタイプ',
    howTitle: '診断の仕組み',
    how: [
      { title: 'Stravaと連携', desc: 'ワンクリックでStravaアカウントを連携。安全なOAuth認証を使用します。' },
      { title: 'ライドデータ分析', desc: '選んだ期間（3ヶ月・6ヶ月・1年）のライドデータ（距離・獲得標高・速度・パワー）を自動分析。' },
      { title: 'キャラクター判定', desc: 'あなたの走りのパターンから6種類のキャラクターを診断して表示します。' },
    ],
    changelogTitle: '更新履歴',
    showAll: (n: number) => `すべて見る（${n}件）`,
    footerNote: 'Stravaのデータは分析にのみ使用し、保存・共有しません',
    privacy: 'プライバシーポリシー',
  },
  starter: {
    step1: '① あなたのタイプはどれだと思う？',
    unknown: 'わからない・予想しない',
    step2: '② 分析する期間を選んで診断！',
    yourGuess: 'あなたの予想：',
    includePrivate: '「自分のみ」に設定したライドも含める',
    includePrivateNote: 'ローラーの記録を非公開にしている方向け。Stravaの許可画面で、非公開のアクティビティの読み取りも求めます',
  },
  periods: { '90': '3ヶ月', '180': '6ヶ月', '365': '1年' } as Record<string, string>,
  loading: {
    title: 'Stravaに接続中',
    body1: '認証ページに移動します',
    body2: 'そのままお待ちください',
    period: '分析期間：',
  },
  result: {
    preview: '⚡ PREVIEW MODE — テスト表示中',
    totalDistance: '合計距離',
    avgDistance: '平均距離',
    avgSpeed: '平均速度',
    totalElevation: '総獲得標高',
    climbingRatio: '山岳比率',
    ridingDays: '乗った日数',
    avgPower: '平均パワー',
    indoorTag: '（屋内）',
    outdoorTag: '（屋外）',
    daysPerWeek: (n: string) => `週${n}日`,
    retry: '← もう一度診断する',
    errorMissing: '診断データが見つかりません',
    errorInvalid: 'データの読み込みに失敗しました',
    backToTop: 'トップに戻る',
    tryAgain: 'もう一度診断する',
  },
  evolution: {
    evolved: '進化！',
    keeping: (name: string) => `${name} を維持中`,
    period: (days: number) => (days >= 365 ? '1年' : `${Math.round(days / 30)}ヶ月`),
    previous: (period: string, date: string) => `前回の${period}診断: ${date}`,
  },
  reveal: {
    yourGuess: 'あなたの予想',
    result: '診断結果',
    hit: '予想的中！自分の走りをよくわかっている',
    miss: '意外な一面！データが見ていたあなたの走り',
  },
  share: {
    // X のロゴの前後に置く文字（日本語は「[X]でポスト」、英語は「Post on [X]」と語順が違うため2つに分けている）
    postBeforeLogo: '',
    postAfterLogo: 'でポスト',
    saving: '⏳ 処理中...',
    saveMobile: '📲 保存・シェア',
    saveDesktop: '💾 画像をダウンロード',
    shareTitle: 'VeloAva キャラクター診断',
    postText: (name: string, title: string) =>
      `VeloAvaでサイクリストタイプを診断したら「${name}」（${title}）だった！\nあなたは何タイプ？\n#VeloAva #ロードバイク`,
    // 予想と結果の答え合わせ入りの投稿文（予想はユーザー自身の入力）。当たり・外れで話のネタになるように
    postTextHit: (name: string, title: string) =>
      `VeloAvaでサイクリストタイプを診断したら、予想どおり「${name}」（${title}）だった！\nあなたは何タイプ？\n#VeloAva #ロードバイク`,
    postTextMiss: (predicted: string, name: string, title: string) =>
      `自分は${predicted}だと思ってたのに、VeloAvaで診断したら「${name}」（${title}）だった…！\nあなたは何タイプ？\n#VeloAva #ロードバイク`,
  },
  sharePage: {
    metaTitle: (name: string) => `私のサイクリストタイプは「${name}」 — VeloAva`,
    metaDescription: 'Stravaのライドデータから、あなたのサイクリストタイプを6種類のキャラクターで診断します。',
    cta: 'あなたも診断する →',
    note: 'Stravaと連携して30秒で診断',
    // 検索結果に出るタイトル（X のカードは metaTitle のまま「私のサイクリストタイプは〜」）
    seoTitle: (name: string, title: string, typeName: string) => `${name}（${title}）｜${typeName}タイプの特徴 — VeloAva サイクリスト診断`,
    featuresTitle: (typeName: string) => `${typeName}タイプの特徴`,
    strengthsTitle: '得意なこと',
    loreTitle: 'ストーリー',
    otherVariantTitle: (sexLabel: string) => `${sexLabel}のキャラクター`,
    sexLabel: { male: '男性版', female: '女性版' } as Record<string, string>,
    otherTypesTitle: 'ほかのタイプ',
    indexLink: '全12キャラクターを見る →',
    trustTitle: '安心して試せる理由',
  },
  og: {
    alt: 'VeloAva サイクリストキャラクター診断',
    lead: '私のサイクリストタイプは',
    cta: 'あなたは何タイプ？',
  },
  typesIndex: {
    metaTitle: 'サイクリストタイプ図鑑（全12キャラ）— VeloAva',
    metaDescription: 'クライマー、スプリンター、タイムトライアリスト、グランフォンド、オールラウンダー、サンデーライダー。Stravaのライドデータで診断できる6タイプ・男女12キャラクターの特徴を紹介します。',
    title: 'サイクリストタイプ図鑑',
    lead: '6タイプ × 男女で12キャラクター。あなたはどれ？',
    cta: '自分のタイプを診断する →',
  },
  notFound: {
    title: 'ページが見つかりません',
    body: 'URLが間違っているか、ページが移動した可能性があります。',
    backTop: 'トップに戻って診断する',
  },
  privacy: {
    metaTitle: 'プライバシーポリシー — VeloAva',
    title: 'プライバシーポリシー',
    updated: 'Privacy Policy — 最終更新: 2026年11月',
    backTop: '← VeloAva トップ',
    backBottom: '← トップに戻る',
  },
  axes: { climbing: '登坂力', speed: 'スピード', endurance: '持久力', power: '出力', consistency: '継続性' },
  // 日付の表示（前回の診断日・更新履歴）
  formatDate: (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  },
  formatShortDate: (ymd: string) => {
    const [, m, d] = ymd.split('-')
    return `${Number(m)}/${Number(d)}`
  },
}

// typeof ja で「日本語辞書と同じ形」という型を作る。en・pt はこの型に合わないとビルドが通らない
export type Dictionary = typeof ja
