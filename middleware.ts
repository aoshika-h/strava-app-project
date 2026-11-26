// 言語の振り分け（Next.js の決まりで、プロジェクト直下の middleware.ts はページを表示する前に毎回サーバーで動く）
// ページは app/[lang]/ の下にあり、URL の先頭が言語（ja / en / pt）になっている前提で作られている。
// - /en/...・/pt/... はそのまま通す
// - 言語の付いていないURL（/、/result、/c/... など）は、内部で /ja/... に書き換える（rewrite。ブラウザのURLは変わらない）。
//   これで日本語の既存URLが今までどおり使える
// - /ja/... と書かれたら、言語なしのURLへ転送して表記を1つにそろえる
// - 初めての人がトップかキャラ紹介ページに来たときだけ、ブラウザの言語設定（または言語切り替えで選んだ Cookie）を見て /en・/pt に転送する

import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_LOCALE, LOCALE_COOKIE, detectLocale, isLocale } from '@/lib/i18n/config'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const first = pathname.split('/')[1]

  if (first === 'en' || first === 'pt') return NextResponse.next()

  // キャラ別OGP画像（opengraph-image.tsx）の URL は、Next.js が内部のパス（/ja/c/.../opengraph-image）で <meta> に書き出す。
  // 下の転送をかけると X などのカード取得が毎回 307 をはさむので、画像だけは /ja 付きのまま直接返す
  if (first === DEFAULT_LOCALE && pathname.endsWith('/opengraph-image')) return NextResponse.next()

  if (first === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || '/'
    return NextResponse.redirect(url)
  }

  // 自動の振り分けは、人が最初に来る入口（トップとシェアされたキャラ紹介ページ）だけ。
  // 結果ページやプライバシーは、来たURLの言語のまま表示する。クローラー（Xのカード取得など）は振り分けない
  const isEntry = pathname === '/' || (pathname.startsWith('/c/') && !pathname.endsWith('/opengraph-image'))
  const isBot = /bot|crawler|spider|facebookexternalhit/i.test(request.headers.get('user-agent') ?? '')
  if (isEntry && !isBot) {
    const saved = request.cookies.get(LOCALE_COOKIE)?.value
    const preferred = isLocale(saved) ? saved : detectLocale(request.headers.get('accept-language'))
    if (preferred !== DEFAULT_LOCALE) {
      const url = request.nextUrl.clone()
      url.pathname = `/${preferred}${pathname === '/' ? '' : pathname}`
      return NextResponse.redirect(url)
    }
  }

  const url = request.nextUrl.clone()
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`
  url.search = search
  return NextResponse.rewrite(url)
}

// middleware を動かすパスの指定。API・Next.js の内部ファイル・画像などの静的ファイル（拡張子付き）は対象外
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
