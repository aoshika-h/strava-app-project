// ランディングページ
// Strava連携ボタンとアプリの説明を表示するトップページ

import Link from 'next/link'

// URLパラメータのエラーメッセージマッピング
const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Stravaの連携を拒否されました。もう一度試してください。',
  no_code: '認証コードが取得できませんでした。もう一度試してください。',
  analysis_failed: 'データの分析中にエラーが発生しました。しばらくしてから再度お試しください。',
}

interface PageProps {
  searchParams: { error?: string }
}

export default function HomePage({ searchParams }: PageProps) {
  const errorMsg = searchParams.error ? ERROR_MESSAGES[searchParams.error] : null

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white">
      {/* ヒーローセクション */}
      <div className="relative overflow-hidden">
        {/* 背景グラデーション */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          {/* ロゴ・タイトル */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-orange-400 mb-8">
            <span>🚴</span>
            <span>Stravaデータ分析</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              VeloAva
            </span>
            <br />
            あなたのサイクリスト<br />キャラクターを診断
          </h1>

          <p className="text-lg text-white/60 mb-12 max-w-xl mx-auto">
            Stravaのライドデータを分析して、あなたの走りのタイプを6種類のキャラクターから診断します。
            FTP・脚質・頻度・獲得標高をもとに判定。
          </p>

          {/* エラーメッセージ（OAuth失敗時） */}
          {errorMsg && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Strava連携ボタン */}
          <Link
            href="/api/auth/strava"
            className="inline-flex items-center gap-3 bg-[#FC4C02] hover:bg-[#E03D00] text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
          >
            {/* Stravaロゴ（SVG） */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0 3 13.828h4.17" />
            </svg>
            Stravaで診断スタート
          </Link>

          <p className="mt-4 text-xs text-white/30">
            ライドデータの読み取り権限のみ取得します。投稿・変更は一切行いません。
          </p>
        </div>
      </div>

      {/* キャラクタープレビューセクション */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-10 text-white/80">
          6種類のサイクリストタイプ
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { emoji: '🏔️', name: 'クライマー', desc: '山岳の覇者' },
            { emoji: '⚡', name: 'スプリンター', desc: '瞬速の稲妻' },
            { emoji: '⏱️', name: 'タイムトライアリスト', desc: '鉄の持続力' },
            { emoji: '🌄', name: 'グランフォンド', desc: '地平線の果てまで' },
            { emoji: '🎯', name: 'オールラウンダー', desc: '万能の勇者' },
            { emoji: '☀️', name: 'サンデーライダー', desc: '週末の自由人' },
          ].map((c) => (
            <div
              key={c.name}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center hover:bg-white/8 transition-colors"
            >
              <div className="text-4xl mb-2">{c.emoji}</div>
              <div className="font-bold text-sm">{c.name}</div>
              <div className="text-xs text-white/40 mt-1">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 診断の仕組みセクション */}
      <div className="max-w-4xl mx-auto px-6 py-8 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10 text-white/80">
          診断の仕組み
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🔗',
              title: 'Stravaと連携',
              desc: 'ワンクリックでStravaアカウントを連携。安全なOAuth認証を使用します。',
            },
            {
              icon: '📊',
              title: 'ライドデータ分析',
              desc: '直近90日間のライドデータ（距離・獲得標高・速度・パワー）を自動分析。',
            },
            {
              icon: '🎉',
              title: 'キャラクター判定',
              desc: 'あなたの走りのパターンから6種類のキャラクターを診断して表示します。',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-white/50">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* フッター */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-white/20">
        Stravaのデータは分析にのみ使用し、保存・共有しません
      </footer>
    </main>
  )
}
