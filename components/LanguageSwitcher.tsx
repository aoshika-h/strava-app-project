'use client'
// 言語の切り替え（日本語 / English / Português）。全ページの一番上に、右寄せの細い帯として出す
// （右上に重ねて置くと、結果ページのボタンやプレビューの帯と重なるため、ページの流れの中に置いている）
// app/[lang]/layout.tsx に置いている。押すと選んだ言語をクッキーに覚え、同じページの別言語版へ移動する
// 学べること: usePathname（今のURLのパスを読むフック）、クッキーの書き込み、<a> の onClick で移動先を整える

import { usePathname } from 'next/navigation'
import { LOCALES, LOCALE_COOKIE, getDictionary, localePath, type Locale } from '@/lib/i18n'

// '/en/result' → '/result'、'/pt' → '/'、'/result' → '/result'（言語部分を外した「アプリ内のパス」にする）
function stripLocale(pathname: string): string {
  const rest = pathname.replace(/^\/(ja|en|pt)(?=\/|$)/, '')
  return rest === '' ? '/' : rest
}

export default function LanguageSwitcher({ current }: { current: Locale }) {
  const path = stripLocale(usePathname() ?? '/')

  // クッキーに選んだ言語を1年覚える。middleware.ts がトップやキャラ紹介ページに来たときにこれを見て振り分ける
  // （ブラウザの言語設定より、本人が選んだ言語を優先するため）
  const remember = (locale: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
  }

  return (
    <nav aria-label="Language" className="flex justify-end gap-1 px-4 pt-3 text-[11px] bg-[#0A0A0F]">
      {LOCALES.map((locale) => {
        const active = locale === current
        return (
          <a
            key={locale}
            href={localePath(locale, path)}
            hrefLang={getDictionary(locale).htmlLang}
            aria-current={active ? 'true' : undefined}
            data-ga-event="ui_click"
            data-ga-id={`lang_${locale}`}
            onClick={(e) => {
              remember(locale)
              // 結果ページの ?data=... のようなクエリも引き継ぐ（押した瞬間のブラウザの URL から取る）
              e.currentTarget.href = localePath(locale, path) + window.location.search
            }}
            className={`px-2 py-1 rounded-md border transition-colors ${
              active ? 'border-white/30 text-white' : 'border-transparent text-white/55 hover:text-white/80'
            }`}
          >
            {getDictionary(locale).langName}
          </a>
        )
      })}
    </nav>
  )
}
