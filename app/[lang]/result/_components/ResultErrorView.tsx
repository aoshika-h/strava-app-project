// 結果ページのエラー表示（URLに結果データがない／壊れているとき）。app/[lang]/result/page.tsx が status を渡して使う
// 学べること: props の型を 'missing' | 'invalid' のように決まった文字列だけに絞る（ユニオン型）、三項演算子での出し分け
// state もブラウザ専用の処理もないので 'use client' は不要（サーバーで描画されるサーバーコンポーネント）

import Link from 'next/link'
import { getDictionary, localePath, type Locale } from '@/lib/i18n'

export default function ResultErrorView({ lang, status }: { lang: Locale; status: 'missing' | 'invalid' }) {
  const t = getDictionary(lang).result
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-center p-6">
      <div>
        <p className="text-white/50 mb-4">
          {status === 'missing' ? t.errorMissing : t.errorInvalid}
        </p>
        <Link href={localePath(lang, '/')} data-ga-event="ui_click" data-ga-id="error_back_to_top" className="text-orange-400 hover:underline">
          {status === 'missing' ? t.backToTop : t.tryAgain}
        </Link>
      </div>
    </div>
  )
}
