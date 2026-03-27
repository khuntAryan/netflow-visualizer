import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, context } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });

    const systemPrompt = `You are an Advanced Network Architect & Tutor.
    
    CRITICAL CONTEXT (Current Topology):
    - Nodes: ${JSON.stringify(context.nodes.map((n: any) => ({ id: n.id, label: n.data.label, type: n.data.nodeType })))}
    - Edges: ${JSON.stringify(context.edges.map((e: any) => ({ source: e.source, target: e.target })))}
    - Groups: ${JSON.stringify(context.groups)}
    
    TASK:
    1. Classify intent: [EXPLAIN, UPDATE_TOPOLOGY].
    2. If UPDATE_TOPOLOGY: Return the COMPLETE new topology. 
       - Do NOT create from scratch if a modification is requested. 
       - INTEGRATE new nodes logically (connect them to existing hubs/routers).
       - Nodes format: { "id": "...", "type": "customNode", "data": { "label": "...", "nodeType": "router|pc|server|internet" } }
       - Edges format: { "id": "...", "source": "...", "target": "...", "data": { "latency": 10 } }
    3. If EXPLAIN: Short step-based guide (max 12 words per step) explaining the current flow.

    Return JSON exactly:
    {
      "action": "explain" | "update_topology",
      "steps": [{ "title": "...", "text": "...", "nodes": ["id1"] }],
      "topology": { 
         "nodes": [...], 
         "edges": [...], 
         "groups": [...] 
      },
      "briefExplanation": "Summary of the tutoring session or architectural change."
    }
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
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    const data = await response.json();
    return NextResponse.json(JSON.parse(data.choices[0].message.content));

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
