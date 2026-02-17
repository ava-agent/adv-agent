/**
 * Vercel Serverless Function: AI Route Recommendation
 *
 * Proxies requests to Claude claude-haiku-4-5.
 * ANTHROPIC_API_KEY is a server-side env var — never exposed to the browser.
 *
 * POST /api/ai
 * Body: { query: string, routes: RouteSummary[], stream?: boolean }
 */

import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'

interface RouteSummary {
  _id: string
  title: string
  description: string
  difficultyLevel: number
  terrainTags: string[]
  distanceKm: number
  elevationGainM: number
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: '入门级（铺装路面）',
  2: '轻度越野',
  3: '中度越野',
  4: '高难度越野',
  5: '极限越野',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'AI service not configured' })
  }

  const { query, routes, stream = false }: { query: string; routes: RouteSummary[]; stream?: boolean } = req.body

  if (!query || !routes?.length) {
    return res.status(400).json({ error: 'Missing required fields: query, routes' })
  }

  const routeContext = routes.map(r => (
    `ID: ${r._id}\n路线: ${r.title}\n难度: ${DIFFICULTY_LABELS[r.difficultyLevel] || r.difficultyLevel}\n地形: ${r.terrainTags.join(', ')}\n距离: ${r.distanceKm}km\n海拔增益: ${r.elevationGainM}m\n简介: ${r.description}`
  )).join('\n\n---\n\n')

  const systemPrompt = `你是ADV摩托车路线推荐专家。根据用户的描述，从以下路线列表中推荐最合适的1-3条路线。

请以JSON格式回复，包含：
1. "routeIds": 推荐路线的ID列表（数组）
2. "message": 200字以内的推荐说明，解释为什么推荐这些路线

路线列表：
${routeContext}

重要：只推荐列表中存在的路线ID，不要编造新路线。`

  const client = new Anthropic({ apiKey })

  try {
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('X-Accel-Buffering', 'no')

      const streamResponse = client.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: `用户描述：${query}` }]
      })

      for await (const chunk of streamResponse) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          res.write(chunk.delta.text)
        }
      }
      return res.end()
    } else {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: `用户描述：${query}` }]
      })

      const content = response.content[0]
      if (content.type !== 'text') throw new Error('Unexpected response')

      let result: { routeIds: string[]; message: string }
      try {
        const jsonMatch = content.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.text.match(/(\{[\s\S]*\})/)
        result = JSON.parse(jsonMatch ? jsonMatch[1] : content.text)
      } catch {
        const mentionedIds = routes.filter(r => content.text.includes(r.title)).map(r => r._id)
        result = { routeIds: mentionedIds.slice(0, 3), message: content.text }
      }

      return res.json(result)
    }
  } catch (error: unknown) {
    console.error('AI error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'AI request failed' })
  }
}
