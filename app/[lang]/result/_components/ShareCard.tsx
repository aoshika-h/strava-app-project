'use client'
// シェアカードコンポーネント
// キャラクター情報を1枚にまとめ、ダウンロード/共有ボタン付きで表示する
// このコンポーネントがページ最上部に配置され、ヒーローセクションを兼ねる
// 学べること: useRef で画面上の要素（DOM）をつかむ、async 関数と try/catch/finally、必要なときだけライブラリを
// 読み込む（動的 import）、コールバック式の関数を Promise に包んで await する、Web Share API（スマホの共有シート）

import { useRef, useState } from 'react'
import { getVariant, type Character, type CharacterId, type Sex } from '@/lib/characters'
import { gtagEvent } from '@/lib/gtag'
import { shareSlug } from '@/lib/share'
import { getDictionary, type Locale } from '@/lib/i18n'

// この部品が受け取る props の型。interface で形を決めておくと、渡し忘れや型違いを TypeScript が教えてくれる
interface Props {
  lang: Locale
  character: Character
  characterId: CharacterId
  sex: Sex
}

export default function ShareCard({ lang, character, characterId, sex }: Props) {
  const t = getDictionary(lang).share
  const imageSrc = `/characters/${characterId}_${sex}.png`
  const genderText = getVariant(characterId, sex, lang)
  // useRef: 画面上のカード要素（<div ref={cardRef}>）をつかんでおく入れ物。値を変えても再描画は起きない。
  // 画像化するときに「どの要素を写すか」を html2canvas に渡すために使う
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  // サーバーには navigator がないので typeof で確かめてから使う（ボタンの文言をスマホ/PCで変えるため）
  const isMobileDevice = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0

  // LINEなどのアプリ内ブラウザは window.open をブロックするため、通常のリンクで投稿画面を開く。
  // リンク先は x.com ではなく自サイトの中継（app/api/share/x/route.ts）。x.com への直接リンクだと、GA4 の「離脱クリック」が
  // リンクのURL（キャラ名・キャラID・性別入り）を自動で記録してしまうため。中継が投稿文とシェアURL（UTM付き）を組み立てて X へ転送する
  const xShareHref = `/api/share/x?c=${shareSlug(characterId, sex)}&lang=${lang}`

  // 保存・共有ボタンの処理。画像化 → スマホなら共有シート、PCならダウンロード
  const handleSave = async () => {
    if (!cardRef.current) return
    setSaving(true) // ボタンを「処理中...」にする
    try {
      // 動的 import: html2canvas は大きいので、ボタンが押されたときに初めて読み込む（最初の表示を速くするため）
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0d0d18',
        scale: 2,         // 2倍解像度
        useCORS: true,
        logging: false,
      })

      const filename = `veloava-${characterId}.png`

      // タッチデバイス（SP/タブレット）: Web Share APIでネイティブ共有シートを表示
      const isMobile = navigator.maxTouchPoints > 0
      if (isMobile && navigator.share) {
        // canvas.toBlob は結果をコールバックで返す古い形の関数なので、Promise に包んで await できるようにしている
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/png')
        )
        const file = new File([blob], filename, { type: 'image/png' })
        gtagEvent('share_card', { method: 'share' })
        // 共有シートを開く。ユーザーが閉じると AbortError になるので、下の catch でエラー扱いしない
        await navigator.share({ files: [file], title: t.shareTitle })
        return
      }

      // デスクトップ: PNGダウンロード（見えない <a download> を作ってクリックさせる定番の方法）
      gtagEvent('share_card', { method: 'download' })
      const link = document.createElement('a')
      link.download = filename
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error('保存エラー:', e)
      }
    } finally {
      // finally は成功しても失敗しても必ず実行される。ボタンを元に戻す
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Xポスト・保存ボタン（カードの上に配置） */}
      {/* 押しやすいようにカードと同じ幅いっぱい・高さ52pxにする */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '360px', maxWidth: '100%', margin: '0 auto 16px' }}>
        <a
          href={xShareHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => gtagEvent('share_x')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            minHeight: '52px',
            backgroundColor: '#000',
            color: '#fff',
            fontWeight: 900,
            fontSize: '16px',
            padding: '12px 24px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.25)',
            textDecoration: 'none',
          }}
        >
          {t.postBeforeLogo}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          {t.postAfterLogo}
        </a>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            minHeight: '52px',
            backgroundColor: character.accentColor,
            color: '#fff',
            fontWeight: 900,
            fontSize: '16px',
            padding: '12px 28px',
            borderRadius: '14px',
            border: 'none',
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.6 : 1,
            boxShadow: `0 4px 24px ${character.accentColor}55`,
          }}
        >
          {saving ? t.saving : isMobileDevice ? t.saveMobile : t.saveDesktop}
        </button>
      </div>

      {/* ========== キャプチャ対象カード ========== */}
      {/* inline styleを使う: Tailwindクラスはhtml2canvasで取りこぼすため。ref={cardRef} でこの div を画像化の対象にする */}
      <div
        ref={cardRef}
        style={{
          width: '360px',
          maxWidth: '100%',
          margin: '0 auto',
          background: 'linear-gradient(160deg, #0d0d18 0%, #12122a 100%)',
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", sans-serif',
        }}
      >
        {/* 背景グロー */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 35%, ${character.accentColor}55 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />

        {/* ストライプ装飾 */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 24px)',
          pointerEvents: 'none',
        }} />

        {/* キャラクター画像 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={genderText.name}
          crossOrigin="anonymous"
          style={{ width: '100%', display: 'block', position: 'relative' }}
        />

        {/* テキストエリア */}
        <div style={{
          padding: '20px 24px 28px',
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* 肩書きバッジ */}
          <div style={{
            display: 'inline-block',
            fontSize: '10px',
            fontWeight: 900,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: character.accentColor,
            background: `${character.accentColor}20`,
            border: `1px solid ${character.accentColor}55`,
            borderRadius: '20px',
            padding: '4px 12px',
            marginBottom: '10px',
          }}>
            {genderText.title}
          </div>

          {/* キャラクター名。結果ページの主題なので見出し（h1）にする（検索エンジン・読み上げソフト向け）。
              見た目は inline style で決めるので、h1 の既定の余白は margin で打ち消す */}
          <h1 style={{
            fontSize: '30px',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.2,
            margin: '0 0 10px',
          }}>
            {genderText.name}
          </h1>

          {/* 必殺技 */}
          <div style={{
            fontSize: '13px',
            fontWeight: 900,
            color: character.accentColor,
            letterSpacing: '1px',
            marginBottom: '14px',
          }}>
            {genderText.specialMove}
          </div>

          {/* セリフ */}
          <div style={{
            fontSize: '13px',
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.75)',
            background: `${character.accentColor}18`,
            border: `1px solid ${character.accentColor}40`,
            borderRadius: '12px',
            padding: '12px 16px',
            lineHeight: 1.7,
            marginBottom: '18px',
          }}>
            {genderText.catchphrase}
          </div>

          {/* キャラクター説明 */}
          <div style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.7,
            textAlign: 'left',
            marginBottom: '10px',
          }}>
            {genderText.description}
          </div>
          <div style={{
            fontSize: '10px',
            // 文字のコントラストは WCAG AA（4.5:1）以上にする（0.55 で約6:1）
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.6,
            textAlign: 'left',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '10px',
            marginBottom: '14px',
          }}>
            📖 {genderText.lore}
          </div>

          {/* フッター: VeloAvaロゴ（ロゴはコントラストの基準の対象外なので、控えめな薄さのまま。check-app も data-logo を除外する） */}
          <div data-logo style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}>
            VeloAva
          </div>
        </div>
      </div>
    </div>
  )
}
