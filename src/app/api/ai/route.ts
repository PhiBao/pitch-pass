import { NextResponse } from 'next/server'

const DGRID_URL = 'https://api.dgrid.ai/v1/chat/completions'

export async function POST(request: Request) {
  const key = process.env.DGRID_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'AI_NOT_CONFIGURED' }, { status: 503 })
  }

  const { type, matchContext } = await request.json()

  let systemPrompt = ''
  let userPrompt = ''

  if (type === 'recap') {
    systemPrompt = 'You are a sports commentator. Write exciting, concise match recaps using real match data.'
    userPrompt = `Write a short, exciting football match recap paragraph. ${matchContext || ''} Mention the score, key moments, and how the winner advanced. Keep it under 100 words.`
  } else if (type === 'pick') {
    systemPrompt = 'You are a football analyst. Give brief, reasoned match predictions based on real data.'
    userPrompt = `Two football teams are about to play. ${matchContext || ''} Based on their form, suggest which team is likely to win and why, in 2-3 sentences. Mention specific strengths.`
  } else {
    return NextResponse.json({ error: 'unknown type' }, { status: 400 })
  }

  try {
    const res = await fetch(DGRID_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 300,
        stream: true,
      }),
    })

    if (!res.ok || !res.body) {
      const text = await res.text()
      return NextResponse.json({ error: text || 'AI API error' }, { status: res.status })
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) { controller.close(); break }
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))
          for (const line of lines) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              if (content) {
                controller.enqueue(new TextEncoder().encode(content))
              }
            } catch {}
          }
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
