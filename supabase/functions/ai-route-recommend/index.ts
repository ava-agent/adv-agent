/**
 * Supabase Edge Function: AI Route Recommendation
 *
 * Uses Claude API to analyze user's natural language query and recommend
 * the most suitable motorcycle routes from the provided list.
 *
 * Deploy with: supabase functions deploy ai-route-recommend
 * Set secret:  supabase secrets set ANTHROPIC_API_KEY=your-key
 */

import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface RouteSummary {
  _id: string
  title: string
  description: string
  difficultyLevel: number
  terrainTags: string[]
  distanceKm: number
  elevationGainM: number
}

interface RequestBody {
  query: string
  routes: RouteSummary[]
  stream?: boolean
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: '入门级（铺装路面）',
  2: '轻度越野',
  3: '中度越野',
  4: '高难度越野',
  5: '极限越野'
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const { query, routes, stream = false } = body

    if (!query || !routes || routes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: query, routes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      // Return keyword-based fallback if no API key
      return new Response(
        JSON.stringify({ routeIds: routes.slice(0, 3).map(r => r._id), message: '暂无AI服务，已为您推荐热门路线。' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const client = new Anthropic({ apiKey })

    // Build route context for the prompt
    const routeContext = routes.map(r => (
      `ID: ${r._id}
路线: ${r.title}
难度: ${DIFFICULTY_LABELS[r.difficultyLevel] || r.difficultyLevel}
地形: ${r.terrainTags.join(', ')}
距离: ${r.distanceKm}km
海拔增益: ${r.elevationGainM}m
简介: ${r.description}`
    )).join('\n\n---\n\n')

    const systemPrompt = `你是ADV摩托车路线推荐专家。根据用户的描述，从以下路线列表中推荐最合适的1-3条路线。

请以JSON格式回复，包含：
1. "routeIds": 推荐路线的ID列表（数组）
2. "message": 200字以内的推荐说明，解释为什么推荐这些路线

路线列表：
${routeContext}

重要：只推荐列表中存在的路线ID，不要编造新路线。`

    if (stream) {
      // Streaming response
      const streamResponse = await client.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: `用户描述：${query}` }]
      })

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            let fullText = ''
            for await (const chunk of streamResponse) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                const text = chunk.delta.text
                fullText += text
                controller.enqueue(new TextEncoder().encode(text))
              }
            }
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        }
      })

      return new Response(readableStream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      })
    } else {
      // Non-streaming response
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: `用户描述：${query}` }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type')
      }

      // Parse JSON from response
      let result: { routeIds: string[]; message: string }
      try {
        // Extract JSON from markdown code block if present
        const jsonMatch = content.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
                          content.text.match(/(\{[\s\S]*\})/)
        const jsonStr = jsonMatch ? jsonMatch[1] : content.text
        result = JSON.parse(jsonStr)
      } catch {
        // If not valid JSON, extract route IDs from text and use text as message
        const mentionedIds = routes
          .filter(r => content.text.includes(r.title) || content.text.includes(r._id))
          .map(r => r._id)
        result = { routeIds: mentionedIds.slice(0, 3), message: content.text }
      }

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error: unknown) {
    console.error('AI recommendation error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
