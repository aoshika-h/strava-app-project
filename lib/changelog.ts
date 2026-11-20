// ユーザー向けの更新履歴（新しい順）。内部的な変更（リファクタ・計測など）は載せない
// 先頭の1件がトップのファーストビューに「最新の更新」として出る

export interface ChangelogEntry {
  date: string // YYYY-MM-DD
  text: string
  headline?: string // ファーストビュー用の短い一文（なければ text をそのまま出す）
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-11-20',
    headline: 'パワーの使い方も判定に。ローラー派の方も、もう一度診断してみてください',
    text: 'パワーメーターのデータから「低強度にスプリントを混ぜる」「一定ペースで踏み続ける」といった走り方も判定に使うようにしました。Zwiftなどローラーだけの方は、速度ではなくパワーで判定します。距離が記録されないローラー練習（ERGなど）も数えるようにしました',
  },
  {
    date: '2026-11-19',
    headline: '判定ロジックを改善しました。もう一度診断すると、結果が変わるかも',
    text: '判定ロジックを改善しました。どのタイプにも偏りなく判定され、速度・距離は実走（屋外ライド）で計算します。以前診断した方も、もう一度試すと結果が変わるかもしれません',
  },
  { date: '2026-11-18', text: 'Stravaの権限を見直し、「自分のみ」に設定した非公開アクティビティは読まないようにしました' },
  { date: '2026-11-17', text: '診断前に「自分のタイプ予想」を選べるようになり、結果ページで答え合わせができます' },
  {
    date: '2026-11-16',
    text: 'ライドの数字から「富士山○個分」などの一言コメントと、前回からの変化コメントを表示するようにしました。乗った頻度は「週に乗った日数」で数えるようにしました',
  },
  { date: '2026-11-13', text: '診断が終わると、Stravaとの連携を自動で解除するようにしました' },
  { date: '2026-11-12', text: '「Xでポスト」ボタンを追加。キャラ画像付きのカードでシェアできます' },
  { date: '2026-11-12', text: 'Stravaの本番利用が承認され、どなたでも診断できるようになりました' },
]

// ファーストビューに出すのは、公開から何日以内の更新か
export const LATEST_UPDATE_DAYS = 14

export function isRecent(entry: ChangelogEntry, now = new Date()): boolean {
  return now.getTime() - new Date(`${entry.date}T00:00:00+09:00`).getTime() < LATEST_UPDATE_DAYS * 86_400_000
}

export function formatChangelogDate(date: string): string {
  const [, m, d] = date.split('-')
  return `${Number(m)}/${Number(d)}`
}
