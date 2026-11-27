// 「Xでポスト」の中継（/api/share/x?c=climber_female&lang=en）。X の投稿画面（intent URL）を組み立てて転送するだけ。
// 結果ページのボタンを x.com への直接リンクにすると、GA4 の拡張計測「離脱クリック」が外部リンクのURLを自動で記録し、
// URL に入っているキャラ名・キャラID・性別（Strava 由来の診断結果）が GA に送られてしまう（API Policy 5.4）。
// 自サイト内のリンクは離脱クリックの対象外なので、いったんここを通す。ここは HTML を返さないので GA のページビューも出ない。
// 押したことの計測は、これまでどおり結果ページのボタンの share_x イベント（パラメータなし）で行う。
import { NextRequest, NextResponse } from 'next/server'
import { getSharePageData, shareSlug } from '@/lib/share'
import { getCharacter, isCharacterId } from '@/lib/characters'
import { getDictionary, isLocale, localePath, DEFAULT_LOCALE } from '@/lib/i18n'

export function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl
  const lang = isLocale(searchParams.get('lang')) ? (searchParams.get('lang') as typeof DEFAULT_LOCALE) : DEFAULT_LOCALE
  const slug = searchParams.get('c') ?? ''
  const data = getSharePageData(slug, lang)
  // 知らないキャラなら投稿画面ではなくトップへ（壊れたリンクで X を開かない）
  if (!data) return NextResponse.redirect(`${origin}${localePath(lang, '/')}`)

  // 投稿文は言語ごとの辞書から（ハッシュタグもその国でよく使われるもの）。
  // p は診断前にユーザーが選んだ予想（ユーザー自身の入力）。あれば「予想どおり」「予想と違った」を入れて、話のネタにしてもらう
  const t = getDictionary(lang).share
  const predicted = searchParams.get('p')
  const text = !isCharacterId(predicted)
    ? t.postText(data.variant.name, data.variant.title)
    : predicted === data.characterId
      ? t.postTextHit(data.variant.name, data.variant.title)
      : t.postTextMiss(getCharacter(predicted, lang).typeName, data.variant.name, data.variant.title)
  // ユーザーのシェアから来た人を自分の宣伝ポストと分けて数えるため、シェアURLにUTMを付ける（着地時に layout.tsx が share_inflow を送る）
  // 入力の c をそのまま使わず、確かめたキャラID・性別から作り直す（余計な文字で UTM を上書きされないように）
  const shareUrl = `${origin}${localePath(lang, `/c/${shareSlug(data.characterId, data.sex)}`)}?utm_source=x&utm_medium=social&utm_campaign=user_share`
  const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
  return NextResponse.redirect(intent)
}
