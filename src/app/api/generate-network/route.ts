import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, context } = await req.json();

    console.log("GPT Network Gen Request received (Groq AI).");
    console.log("GROQ API Key exists:", !!process.env.GROQ_API_KEY);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Groq API key not configured. Please add GROQ_API_KEY to your .env.local file and restart the development server.' 
      }, { status: 500 });
    }

    const systemPrompt = `You are a networking and system design expert. 
    Given a user description, generate a realistic, multi-domain network topology with structured layout.
    
    Requirements:
    - Must include at least 2 distinct Network Domains (e.g., "Corporate LAN", "Public Internet", "Cloud VPC").
    - Connect domains via specified routers.
    - Include a central "Internet" backbone node if applicable (use nodeType: 'router' with label 'The Internet').
    - Must include redundancy and branching paths.
    - Use nodeType from ['pc', 'server', 'router', 'mobile', 'wifi', 'access_point'].
    - For edges, provide realistic latency and edgeType.

    Return JSON in this format:
    {
      "nodes": [
        { "id": "node_id", "type": "customNode", "data": { "label": "Label", "nodeType": "pc|server|router|...", "status": "online" } }
      ],
      "edges": [
        { "id": "edge_id", "source": "node_a", "target": "node_b", "type": "custom", "data": { "edgeType": "wired|wireless", "latency": 10 } }
      ],
      "groups": [
        { "id": "group1", "label": "Corporate Network", "nodes": ["node_id1", "node_id2"], "color": "#10b981" }
      ],
      "sourceNodeId": "id_of_source",
      "targetNodeId": "id_of_dest",
      "explanation": "Detailed architectural explanation"
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
    if (!response.ok) {
        return NextResponse.json({ error: data.error?.message || 'OpenAI API call failed' }, { status: response.status });
    }

    const aiOutput = JSON.parse(data.choices[0].message.content);

    // Basic Validation & Enforcement
    if (!aiOutput.nodes || !aiOutput.edges) {
        throw new Error("Invalid AI Response format");
    }

    // Auto-layout if AI provided 0,0 for all nodes
    const finalNodes = aiOutput.nodes.map((node: any, idx: number) => {
        if (node.position?.x === 0 && node.position?.y === 0) {
            return {
                ...node,
                position: { x: (idx % 3) * 300, y: Math.floor(idx / 3) * 200 }
            };
        }
        return node;
    });

    return NextResponse.json({ ...aiOutput, nodes: finalNodes });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
