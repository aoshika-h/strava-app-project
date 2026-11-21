// 結果ページのエラー表示（URLに結果データがない／壊れているとき）。app/result/page.tsx が status を渡して使う
// 学べること: props の型を 'missing' | 'invalid' のように決まった文字列だけに絞る（ユニオン型）、三項演算子での出し分け
// state もブラウザ専用の処理もないので 'use client' は不要（サーバーで描画されるサーバーコンポーネント）

import Link from 'next/link'

export default function ResultErrorView({ status }: { status: 'missing' | 'invalid' }) {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-center p-6">
      <div>
        <p className="text-white/50 mb-4">
          {status === 'missing' ? '診断データが見つかりません' : 'データの読み込みに失敗しました'}
        </p>
        <Link href="/" data-ga-event="ui_click" data-ga-id="error_back_to_top" className="text-orange-400 hover:underline">
          {status === 'missing' ? 'トップに戻る' : 'もう一度診断する'}
        </Link>
      </div>
    </div>
  )
}
