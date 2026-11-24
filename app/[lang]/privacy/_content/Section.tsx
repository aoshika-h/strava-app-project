// プライバシーポリシーの見出し付きの段落
// children は「タグの中に書いた中身」を受け取る特別な props（<Section title="...">ここ</Section>）
export default function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-base font-bold text-white/80 mb-3 pb-2 border-b border-white/10">{title}</h2>
      <div className="text-sm text-white/55 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}
