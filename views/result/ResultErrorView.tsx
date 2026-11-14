import Link from 'next/link'

export default function ResultErrorView({ status }: { status: 'missing' | 'invalid' }) {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-center p-6">
      <div>
        <p className="text-white/50 mb-4">
          {status === 'missing' ? '診断データが見つかりません' : 'データの読み込みに失敗しました'}
        </p>
        <Link href="/" className="text-orange-400 hover:underline">
          {status === 'missing' ? 'トップに戻る' : 'もう一度診断する'}
        </Link>
      </div>
    </div>
  )
}
