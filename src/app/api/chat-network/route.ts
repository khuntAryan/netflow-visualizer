import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    const systemPrompt = `You are an expert AI Network Assistant. 
    You are helping a user understand their current network topology through an interactive chat.
    
    Current Topology Context:
    - Nodes: ${JSON.stringify(context.nodes.map((n: any) => ({ id: n.id, label: n.data.label, type: n.data.nodeType })))}
    - Source: ${context.sourceId}
    - Target: ${context.targetId}
    - Routing: ${context.algorithm}
    
    Instructions:
    - Respond conversationally and accurately based on the PROVIDED topology.
    - If asked about "this path", refer to the route from ${context.sourceId} to ${context.targetId}.
    - Be technical but accessible.
    - Keep responses concise (max 3 sentences).
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.error?.message }, { status: response.status });

    return NextResponse.json({ content: data.choices[0].message.content });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
