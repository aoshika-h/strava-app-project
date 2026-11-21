// 結果ページの「Ride Insights」（ライドの数値から組み立てた一言コメント）。ResultView が使う
// コメントの文章は lib/insights.ts がサーバー側で作り、ここは並べて表示するだけ
// 学べること: 表示するものがないときは null を返す、.map で一覧を描く（key に一意な値を使う）
export default function InsightsCard({ insights, accentColor }: { insights: string[]; accentColor: string }) {
  if (insights.length === 0) return null
  return (
    <div>
      <h2 className="text-sm font-bold text-white/40 tracking-widest uppercase mb-3">Ride Insights</h2>
      <ul className="space-y-2">
        {insights.map((text) => (
          <li
            key={text}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 leading-relaxed border-l-4"
            style={{ borderLeftColor: accentColor }}
          >
            {text}
          </li>
        ))}
      </ul>
    </div>
  )
}
