// Claude APIを使ってアクティビティ説明文から性格コメントを生成する
// APIキー未設定・説明文不足・APIエラー時はnullを返し、呼び出し元でフォールバックする

import Anthropic from '@anthropic-ai/sdk'

const MEANINGFUL_MIN = 3      // コメント生成に必要な最低説明文数
const MAX_DESC_CHARS = 200    // 1件あたりの説明文の最大文字数
const MAX_DESCRIPTIONS = 15   // 送るアクティビティ説明文の最大件数

export async function analyzePersonality(descriptions: string[]): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  // 空・空白のみの説明を除外して短く切り詰める
  const meaningful = descriptions
    .map((d) => d.trim())
    .filter((d) => d.length > 5)
    .slice(0, MAX_DESCRIPTIONS)
    .map((d) => d.slice(0, MAX_DESC_CHARS))

  if (meaningful.length < MEANINGFUL_MIN) return null

  try {
    // Note: Anthropic APIはデフォルトでユーザーデータをモデル学習に利用しない
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `以下はあるサイクリストがStravaに記録したアクティビティの説明文です。
これらの文章から、このライダーの性格・こだわり・ライドへの姿勢をキャラクター紹介風に2文でまとめてください。
日本語で、カジュアルかつ生き生きとした表現で書いてください。「〇〇するライダー」のような締め方にしてください。

説明文:
${meaningful.map((d, i) => `${i + 1}. ${d}`).join('\n')}`,
        },
      ],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : null
    return text && text.length > 10 ? text : null
  } catch (e) {
    console.error('性格分析エラー:', e)
    return null
  }
}
