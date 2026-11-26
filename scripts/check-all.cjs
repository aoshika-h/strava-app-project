// 動作チェック一式（npm run check）: テスト用の設定で1回だけビルドし、GA計測チェックとアプリ動作チェックを両方とも最後まで実行する
// 片方が失敗しても、もう片方の結果も見られるように続けて実行し、最後にまとめて合否を出す
const { execSync, spawnSync } = require('node:child_process')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const env = {
  ...process.env,
  NEXT_PUBLIC_GA_ID: 'G-TEST',
  STRAVA_CLIENT_ID: 'test-client-id',
  STRAVA_CLIENT_SECRET: 'test-client-secret',
}

console.log('テスト用の設定（測定ID G-TEST）でビルドします…')
try {
  execSync('npx next build', { cwd: ROOT, env, stdio: ['ignore', 'ignore', 'inherit'] })
} catch {
  console.error('\n✗ ビルドに失敗しました。チェックは実行していません')
  process.exit(1)
}

const results = []
for (const [name, file] of [['GA計測', 'check-ga.cjs'], ['アプリ動作', 'check-app.cjs']]) {
  console.log(`\n===== ${name}チェック =====`)
  const r = spawnSync(process.execPath, [path.join(__dirname, file), '--no-build'], { cwd: ROOT, stdio: 'inherit' })
  results.push([name, r.status === 0])
}
console.log('\n===== まとめ =====')
for (const [name, ok] of results) console.log(`${ok ? '✓' : '✗'} ${name}チェック`)
process.exit(results.every(([, ok]) => ok) ? 0 : 1)
