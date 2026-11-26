// 404 ページ（存在しないURL・知らないキャラなど）。サイトの見た目・言語・GA のまま表示する
// not-found.tsx は URL の params を受け取れないので、言語は middleware.ts が付けるリクエストヘッダー（x-veloava-lang）から読む
// 存在しないURLは [...rest]/page.tsx が notFound() を呼んでここに来る（そうしないと Next.js の英語の既定ページになる）
import Link from 'next/link'
import { headers } from 'next/headers'
import { getDictionary, isLocale, localePath, DEFAULT_LOCALE, type Locale } from '@/lib/i18n'

export default function NotFound() {
  const h = headers().get('x-veloava-lang')
  const lang: Locale = isLocale(h) ? h : DEFAULT_LOCALE
  const t = getDictionary(lang).notFound
  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center text-center p-6">
      <div>
        <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-4">404</p>
        <h1 className="text-2xl font-bold mb-3">{t.title}</h1>
        <p className="text-white/60 mb-8">{t.body}</p>
        <Link href={localePath(lang, '/')} data-ga-event="ui_click" data-ga-id="not_found_back_top" className="inline-block font-bold px-6 py-3 rounded-xl text-white" style={{ backgroundColor: '#FC4C02' }}>
          {t.backTop}
        </Link>
      </div>
    </main>
  )
}
