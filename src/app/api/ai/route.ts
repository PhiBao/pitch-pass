import { NextResponse } from 'next/server'

const DGRID_URL = 'https://api.dgrid.ai/v1/chat/completions'

export async function POST(request: Request) {
  const key = process.env.DGRID_API_KEY
  if (!key) {
    return NextResponse.json({ text: 'Match intelligence is updating. Check back soon for AI-powered recaps and predictions.' })
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
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: json.error?.message || 'AI API error' }, { status: res.status })
    }
    return NextResponse.json({ text: json.choices?.[0]?.message?.content || '' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
