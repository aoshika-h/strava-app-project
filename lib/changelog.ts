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
    date: '2026-11-21',
    headline: { ja: 'ローラーを非公開にしている方も、チェックひとつで診断に含められます' },
    text: { ja: '「自分のみ」に設定したライドも含めて診断できるオプションを追加しました。ローラーの記録を非公開にしている方は、診断前にチェックを入れてください（チェックしない場合は、これまでどおり非公開のアクティビティは読みません）' },
  },
  {
    date: '2026-11-20',
    headline: { ja: 'パワーの使い方も判定に。ローラー派の方も、もう一度診断してみてください' },
    text: { ja: 'パワーメーターのデータから「低強度にスプリントを混ぜる」「一定ペースで踏み続ける」といった走り方も判定に使うようにしました。Zwiftなどローラーだけの方は、速度ではなくパワーで判定します。距離が記録されないローラー練習（ERGなど）も数えるようにしました' },
  },
  {
    date: '2026-11-19',
    headline: { ja: '判定ロジックを改善しました。もう一度診断すると、結果が変わるかも' },
    text: { ja: '判定ロジックを改善しました。どのタイプにも偏りなく判定され、速度・距離は実走（屋外ライド）で計算します。以前診断した方も、もう一度試すと結果が変わるかもしれません' },
  },
  { date: '2026-11-18', text: { ja: 'Stravaの権限を見直し、「自分のみ」に設定した非公開アクティビティは読まないようにしました' } },
  { date: '2026-11-17', text: { ja: '診断前に「自分のタイプ予想」を選べるようになり、結果ページで答え合わせができます' } },
  {
    date: '2026-11-16',
    text: { ja: 'ライドの数字から「富士山○個分」などの一言コメントと、前回からの変化コメントを表示するようにしました。乗った頻度は「週に乗った日数」で数えるようにしました' },
  },
  { date: '2026-11-13', text: { ja: '診断が終わると、Stravaとの連携を自動で解除するようにしました' } },
  { date: '2026-11-12', text: { ja: '「Xでポスト」ボタンを追加。キャラ画像付きのカードでシェアできます' } },
  { date: '2026-11-12', text: { ja: 'Stravaの本番利用が承認され、どなたでも診断できるようになりました' } },
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

