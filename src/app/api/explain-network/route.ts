import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { nodes, edges, groups, sourceId, targetId, metrics, algorithm } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    const systemPrompt = `You are an expert Network Architect and Tutor.
    Analyze the provided network topology and explain how traffic flows from the source to the target in clear, educational steps.
    
    Structure your response as JSON:
    {
      "steps": [
        {
          "title": "Layer Name",
          "explanation": "Brief, clear explanation of what happens at this stage.",
          "nodes": ["id1", "id2"] // IDs of relevant nodes for this step
        }
      ],
      "summary": "Overall context of the simulation/performance.",
      "pathExplanation": "Specific details on why this path was selected and the role of the domains involved."
    }

    Network Context:
    - Nodes: ${JSON.stringify(nodes.map((n: any) => ({ id: n.id, label: n.data.label, type: n.data.nodeType })))}
    - Groups: ${JSON.stringify(groups)}
    - Chosen Source: ${sourceId}
    - Chosen Target: ${targetId}
    - Routing Logic: ${algorithm}
    - Metrics: ${JSON.stringify(metrics)}
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
          { role: 'user', content: "Analyze the current state and provide the step-by-step explainer JSON." }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.error?.message }, { status: response.status });

    return NextResponse.json(JSON.parse(data.choices[0].message.content));

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
