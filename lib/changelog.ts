// ユーザー向けの更新履歴（新しい順）。内部的な変更（リファクタ・計測など）は載せない
// 先頭の1件がトップのファーストビューに「最新の更新」として出る
// 呼び出し元: app/[lang]/page.tsx（フッターの履歴）と app/[lang]/_components/LatestUpdate.tsx（NEW 表示）。データと小さな関数だけなのでどこでも動く
// 更新するときは SOURCE の先頭に1件足す（日本語は必須。英語・ポルトガル語も書けばその言語の画面にも出る）

import type { Locale } from './i18n/config'

// 言語ごとの文章。日本語は必須、ほかの言語は訳したものだけ入れる（訳のない更新はその言語では表示しない）
type LocalizedText = { ja: string } & Partial<Record<Exclude<Locale, 'ja'>, string>>

interface ChangelogSource {
  date: string // YYYY-MM-DD
  text: LocalizedText
  headline?: LocalizedText // ファーストビュー用の短い一文（なければ text をそのまま出す）
}

// 画面に渡す形（言語を1つに決めたあと）
export interface ChangelogEntry {
  date: string
  text: string
  headline?: string
}

const SOURCE: ChangelogSource[] = [
  {
    date: '2026-11-27',
    headline: {
      ja: '12キャラ図鑑ができました。投稿文に予想の答え合わせも',
      en: 'New 12-character guide, plus guess results in your posts',
      pt: 'Novo guia dos 12 personagens e palpite no seu post',
    },
    text: {
      ja: '6タイプ・男女12キャラの特徴やストーリーをまとめた図鑑ページを追加しました。診断前にタイプを予想した人は、Xでポストするときの投稿文に「予想どおり」「予想と違った」が入ります',
      en: 'Added a guide page with the traits and stories of all 6 types and 12 characters. If you guessed your type before the diagnosis, your X post now says whether you got it right',
      pt: 'Adicionamos um guia com as características e histórias dos 6 tipos e 12 personagens. Se você deu um palpite antes do diagnóstico, o post no X agora conta se acertou',
    },
  },
  {
    date: '2026-11-21',
    headline: {
      ja: 'ローラーを非公開にしている方も、チェックひとつで診断に含められます',
      en: 'Keep your indoor rides private? Now you can include them with one tick',
      pt: 'Deixa os treinos no rolo como privados? Agora dá para incluí-los com um clique',
    },
    text: {
      ja: '「自分のみ」に設定したライドも含めて診断できるオプションを追加しました。ローラーの記録を非公開にしている方は、診断前にチェックを入れてください（チェックしない場合は、これまでどおり非公開のアクティビティは読みません）',
      en: 'New option to include rides set to "Only You". If you keep indoor sessions private, tick the box before the diagnosis (without it, private activities are not read, as before)',
      pt: 'Nova opção para incluir pedais em "Somente você". Se você deixa os treinos no rolo como privados, marque a opção antes do diagnóstico (sem ela, atividades privadas continuam não sendo lidas)',
    },
  },
  {
    date: '2026-11-20',
    headline: {
      ja: 'パワーの使い方も判定に。ローラー派の方も、もう一度診断してみてください',
      en: 'How you use your power now counts too. Indoor riders, give it another try',
      pt: 'Agora o jeito de usar a potência também conta. Quem pedala no rolo, faça de novo',
    },
    text: {
      ja: 'パワーメーターのデータから「低強度にスプリントを混ぜる」「一定ペースで踏み続ける」といった走り方も判定に使うようにしました。Zwiftなどローラーだけの方は、速度ではなくパワーで判定します。距離が記録されないローラー練習（ERGなど）も数えるようにしました',
      en: 'Power meter data now shows riding styles like "easy riding with sprints" or "steady pacing". Indoor-only riders (Zwift etc.) are judged by power instead of speed, and indoor sessions with no distance (ERG workouts) now count',
      pt: 'Os dados do potenciômetro agora mostram estilos como "giro leve com sprints" ou "ritmo constante". Quem pedala só no rolo (Zwift etc.) é avaliado pela potência em vez da velocidade, e treinos sem distância (modo ERG) agora contam',
    },
  },
  {
    date: '2026-11-19',
    headline: {
      ja: '判定ロジックを改善しました。もう一度診断すると、結果が変わるかも',
      en: 'Improved type matching. Try again — your result may change',
      pt: 'Melhoramos o diagnóstico. Faça de novo — seu resultado pode mudar',
    },
    text: {
      ja: '判定ロジックを改善しました。どのタイプにも偏りなく判定され、速度・距離は実走（屋外ライド）で計算します。以前診断した方も、もう一度試すと結果が変わるかもしれません',
      en: 'Improved type matching: all types are now judged evenly, and speed and distance come from outdoor rides. If you tried before, your result may change',
      pt: 'Melhoramos o diagnóstico: todos os tipos são avaliados de forma equilibrada, e velocidade e distância vêm dos pedais na rua. Se você já fez antes, o resultado pode mudar',
    },
  },
  { date: '2026-11-18', text: {
      ja: 'Stravaの権限を見直し、「自分のみ」に設定した非公開アクティビティは読まないようにしました',
      en: 'Reduced Strava permissions: activities set to "Only You" are no longer read',
      pt: 'Reduzimos as permissões do Strava: atividades em "Somente você" não são mais lidas',
    } },
  { date: '2026-11-17', text: {
      ja: '診断前に「自分のタイプ予想」を選べるようになり、結果ページで答え合わせができます',
      en: 'Guess your type before the diagnosis and check it on the result page',
      pt: 'Dê seu palpite antes do diagnóstico e confira na página de resultado',
    } },
  {
    date: '2026-11-16',
    text: {
      ja: 'ライドの数字から「富士山○個分」などの一言コメントと、前回からの変化コメントを表示するようにしました。乗った頻度は「週に乗った日数」で数えるようにしました',
      en: 'Added fun ride insights (like how many Mont Ventoux climbs you rode) and comments on changes since your last diagnosis. Frequency is now counted as riding days per week',
      pt: 'Adicionamos comentários divertidos sobre seus pedais (como quantos Picos da Bandeira você subiu) e sobre a mudança desde o último diagnóstico. A frequência agora conta dias pedalados por semana',
    },
  },
  { date: '2026-11-13', text: {
      ja: '診断が終わると、Stravaとの連携を自動で解除するようにしました',
      en: 'VeloAva now disconnects from Strava automatically after the diagnosis',
      pt: 'O VeloAva agora se desconecta do Strava automaticamente após o diagnóstico',
    } },
  { date: '2026-11-12', text: {
      ja: '「Xでポスト」ボタンを追加。キャラ画像付きのカードでシェアできます',
      en: 'Added a "Post on X" button — share a card with your character image',
      pt: 'Novo botão "Postar no X" — compartilhe um card com a imagem do seu personagem',
    } },
  { date: '2026-11-12', text: {
      ja: 'Stravaの本番利用が承認され、どなたでも診断できるようになりました',
      en: 'Strava approved VeloAva for production — anyone can try it now',
      pt: 'O Strava aprovou o VeloAva para produção — agora qualquer pessoa pode usar',
    } },
]

// 指定した言語に訳がある更新だけを、その言語の文章で返す（新しい順）
export function getChangelog(locale: Locale): ChangelogEntry[] {
  return SOURCE.flatMap((e) => {
    const text = e.text[locale]
    if (!text) return []
    const headline = e.headline?.[locale]
    return [{ date: e.date, text, ...(headline ? { headline } : {}) }]
  })
}

// ファーストビューに出すのは、公開から何日以内の更新か
export const LATEST_UPDATE_DAYS = 14

// 日付は日本時間の 0 時として扱う（+09:00）。86_400_000 は1日のミリ秒（_ は桁区切りで値は 86400000）
// `now = new Date()` は引数の既定値。テストでは好きな日時を渡して確かめられる
export function isRecent(entry: ChangelogEntry, now = new Date()): boolean {
  return now.getTime() - new Date(`${entry.date}T00:00:00+09:00`).getTime() < LATEST_UPDATE_DAYS * 86_400_000
}

