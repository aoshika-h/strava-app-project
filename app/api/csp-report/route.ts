// CSP（Content-Security-Policy）の違反レポートの受け口（POST /api/csp-report）。
// いまは Report-Only（違反してもブロックせず、報告だけする）で様子を見ている段階。Vercel のログに出た報告を見て、
// 正しい読み込みが引っかかっていないことを確かめてから、next.config.mjs で本当にブロックするモード（Content-Security-Policy）に切り替える。
// 報告には違反が起きたページのURLが入る。結果ページのURLには診断結果（?data=、Strava 由来）が入るので、クエリを消してからログに出す
import { NextRequest, NextResponse } from 'next/server'

// URL からクエリとハッシュを落とす（パスまでで十分。data= を残さない）
function stripQuery(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    const u = new URL(value)
    return u.origin + u.pathname
  } catch {
    return value.split(/[?#]/)[0]
  }
}

export async function POST(request: NextRequest) {
  // 大きすぎる本文は読まない（誰でも送れる口なので、ログを汚されないように）
  const text = (await request.text()).slice(0, 10_000)
  try {
    const body = JSON.parse(text)
    // 古い形式（report-uri）は { "csp-report": {...} }、新しい形式（Reporting API）は [{ body: {...} }]
    const reports = Array.isArray(body) ? body.map((r) => r?.body ?? {}) : [body?.['csp-report'] ?? {}]
    for (const r of reports.slice(0, 5)) {
      console.warn('[csp-report]', JSON.stringify({
        directive: r['violated-directive'] ?? r['effectiveDirective'] ?? r['effective-directive'],
        blocked: stripQuery(r['blocked-uri'] ?? r['blockedURL']),
        page: stripQuery(r['document-uri'] ?? r['documentURL']),
        source: stripQuery(r['source-file'] ?? r['sourceFile']),
        line: r['line-number'] ?? r['lineNumber'],
      }))
    }
  } catch {
    // 形式が違うものは無視する
  }
  return new NextResponse(null, { status: 204 })
}
