// CSP（Content-Security-Policy）の違反レポートの受け口（POST /api/csp-report）。
// いまは Report-Only（違反してもブロックせず、報告だけする）で様子を見ている段階。Vercel のログに出た報告を見て、
// 正しい読み込みが引っかかっていないことを確かめてから、next.config.mjs で本当にブロックするモード（Content-Security-Policy）に切り替える。
// 報告には違反が起きたページのURLが入る。結果ページのURLには診断結果（?data=、Strava 由来）が入るので、クエリを消してからログに出す。
// 誰でも送れる口なので、大きすぎる本文は読まずに捨て、文字列以外の値や中身のない報告はログに出さない
import { NextRequest, NextResponse } from 'next/server'

const MAX_BODY = 10_000 // バイト。ブラウザの正しい報告はこれより十分小さい
const MAX_REPORTS = 5 // 1回の送信でログに出す件数の上限

// 文字列だけを受け付け、URL ならクエリとハッシュを落としてパスまでにする（data= を残さない）。長さも切る
function cleanUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  try {
    const u = new URL(value)
    return (u.origin + u.pathname).slice(0, 300)
  } catch {
    return value.split(/[?#]/)[0].slice(0, 300)
  }
}
function cleanText(value: unknown): string | undefined {
  return typeof value === 'string' ? value.slice(0, 200) : undefined
}

export async function POST(request: NextRequest) {
  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > MAX_BODY) return new NextResponse(null, { status: 204 })
  const text = (await request.text()).slice(0, MAX_BODY)
  try {
    const body = JSON.parse(text)
    // 古い形式（report-uri）は { "csp-report": {...} }、新しい形式（Reporting API）は [{ body: {...} }]
    const reports: unknown[] = Array.isArray(body) ? body.map((r) => r?.body) : [body?.['csp-report']]
    for (const r of reports.slice(0, MAX_REPORTS)) {
      if (!r || typeof r !== 'object') continue
      const v = r as Record<string, unknown>
      const entry = {
        directive: cleanText(v['violated-directive'] ?? v['effectiveDirective'] ?? v['effective-directive']),
        blocked: cleanUrl(v['blocked-uri'] ?? v['blockedURL']),
        page: cleanUrl(v['document-uri'] ?? v['documentURL']),
        source: cleanUrl(v['source-file'] ?? v['sourceFile']),
        line: typeof (v['line-number'] ?? v['lineNumber']) === 'number' ? (v['line-number'] ?? v['lineNumber']) : undefined,
      }
      // 違反した指示も読み込み先もない報告は、意味がないので出さない
      if (!entry.directive && !entry.blocked) continue
      console.warn('[csp-report]', JSON.stringify(entry))
    }
  } catch {
    // 形式が違うものは無視する
  }
  return new NextResponse(null, { status: 204 })
}
