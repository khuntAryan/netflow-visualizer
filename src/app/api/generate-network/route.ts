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

Given a user description, generate a realistic, fully connected, multi-domain network topology with a structured layout.

CRITICAL TOPOLOGY RULES:

1. EVERY node MUST be connected to at least one other node.
2. NEVER create isolated nodes.
3. EVERY edge source and target MUST reference an existing node ID.
4. The topology MUST form one connected network.
5. Do NOT create nodes that are not connected to the rest of the topology.
6. Use realistic hierarchical network architecture.
7. Include redundancy and branching paths where appropriate.
8. Use realistic network relationships rather than randomly connecting devices.

NETWORK HIERARCHY:

Internet
  ↓
ISP Router
  ↓
Edge Router
  ↓
Firewall
  ↓
Core Router 1 / Core Router 2
  ↓
Distribution Routers
  ↓
Access Points / WiFi / Servers / PCs / Mobile Devices

REDUNDANCY RULES:

- Include two core routers whenever the topology is large enough to support redundancy.
- Important distribution networks should connect to both core routers where possible.
- The firewall should connect to the core layer.
- Critical servers should be connected to the Data Center network.
- End devices must connect through an appropriate access layer.
- Do not create redundant links that make no architectural sense.

DOMAIN RULES:

- Must include at least 2 distinct Network Domains.
- Examples include:
  - Academic Network
  - Administration Network
  - Data Center
  - Hostel Network
  - Research Network
  - Guest Network
  - Public Internet
- Domains must be connected through appropriate routers or network devices.
- Do not leave any domain disconnected.

DEVICE RULES:

Use ONLY these nodeTypes:

['pc', 'server', 'router', 'mobile', 'wifi', 'access_point']

If a concept such as Firewall, Switch, NMS, RMON, ISP, or Data Center is required but there is no dedicated nodeType available, represent it using one of the supported nodeTypes and make the label descriptive.

Examples:
- Firewall → nodeType: 'router', label: 'Campus Firewall'
- ISP → nodeType: 'router', label: 'ISP Router'
- NMS → nodeType: 'server', label: 'NMS Server'
- RMON → nodeType: 'server', label: 'RMON Monitoring Server'
- Switch → nodeType: 'router', label: 'Distribution Switch'

CONNECTIVITY RULES:

- PCs must connect to an access device, switch-like router, WiFi device, or appropriate network device.
- Mobile devices should normally connect through WiFi or Access Points.
- Servers must connect to a network infrastructure device.
- Routers must connect to other network infrastructure devices.
- Internet must connect to an ISP router.
- ISP router must connect to the campus edge/router.
- Do not connect every device directly to the Internet.
- Do not connect end devices directly to unrelated devices.
- Avoid meaningless peer-to-peer connections.

LATENCY RULES:

Use realistic latency values:
- Same LAN / access connection: 1-5 ms
- Building-to-building connection: 5-20 ms
- Campus core connection: 1-10 ms
- Campus-to-ISP: 10-40 ms
- Internet/WAN connection: 20-100 ms
- Wireless connection: 2-30 ms

EDGE RULES:

Every edge must contain:
- id
- source
- target
- type: "custom"
- data.edgeType: "wired" or "wireless"
- data.latency: realistic number

GROUP RULES:

Groups should represent meaningful network domains such as:
- Academic Network
- Administration Network
- Data Center
- Hostel Network
- Research Network
- Guest Network
- Internet / ISP

Every node ID inside a group MUST exist in the nodes array.

SOURCE AND TARGET:

- sourceNodeId MUST reference an existing node.
- targetNodeId MUST reference an existing node.
- Prefer sourceNodeId as a realistic client/end device.
- Prefer targetNodeId as a realistic destination such as a server or Internet node.
- The source and target must be connected through the generated topology.

LAYOUT RULES:

- Generate meaningful positions for nodes.
- Avoid placing every node at 0,0.
- Use a hierarchical left-to-right or top-to-bottom layout.
- Internet/ISP should generally be positioned toward the top or left.
- Core network should be central.
- Distribution/access networks should branch from the core.
- End devices should appear toward the edges of their respective domains.
- Avoid excessive node overlap.

IMPORTANT:

- Do NOT generate isolated nodes.
- Do NOT generate disconnected domains.
- Do NOT reference nonexistent node IDs.
- Do NOT use unsupported nodeTypes.
- Do NOT return markdown.
- Return ONLY the required JSON object.

Return JSON in this format:
{
  "nodes": [
    {
      "id": "node_id",
      "type": "customNode",
      "position": {
        "x": 0,
        "y": 0
      },
      "data": {
        "label": "Label",
        "nodeType": "pc|server|router|mobile|wifi|access_point",
        "status": "online|offline|degraded"
      }
    }
  ],
  "edges": [
    {
      "id": "edge_id",
      "source": "node_a",
      "target": "node_b",
      "type": "custom",
      "data": {
        "edgeType": "wired|wireless",
        "latency": 10
      }
    }
  ],
  "groups": [
    {
      "id": "group1",
      "label": "Corporate Network",
      "nodes": ["node_id1", "node_id2"],
      "color": "#10b981"
    }
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
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "network_topology",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: [
                "nodes",
                "edges",
                "groups",
                "sourceNodeId",
                "targetNodeId",
                "explanation"
              ],
              properties: {
                nodes: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: [
                      "id",
                      "type",
                      "position",
                      "data"
                    ],
                    properties: {
                      id: {
                        type: "string"
                      },
                      type: {
                        type: "string",
                        enum: ["customNode"]
                      },
                      position: {
                        type: "object",
                        additionalProperties: false,
                        required: ["x", "y"],
                        properties: {
                          x: {
                            type: "number"
                          },
                          y: {
                            type: "number"
                          }
                        }
                      },
                      data: {
                        type: "object",
                        additionalProperties: false,
                        required: [
                          "label",
                          "nodeType",
                          "status"
                        ],
                        properties: {
                          label: {
                            type: "string"
                          },
                          nodeType: {
                            type: "string",
                            enum: [
                              "pc",
                              "server",
                              "router",
                              "mobile",
                              "wifi",
                              "access_point"
                            ]
                          },
                          status: {
                            type: "string",
                            enum: [
                              "online",
                              "offline",
                              "degraded"
                            ]
                          }
                        }
                      }
                    }
                  }
                },
                edges: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: [
                      "id",
                      "source",
                      "target",
                      "type",
                      "data"
                    ],
                    properties: {
                      id: {
                        type: "string"
                      },
                      source: {
                        type: "string"
                      },
                      target: {
                        type: "string"
                      },
                      type: {
                        type: "string",
                        enum: ["custom"]
                      },
                      data: {
                        type: "object",
                        additionalProperties: false,
                        required: [
                          "edgeType",
                          "latency"
                        ],
                        properties: {
                          edgeType: {
                            type: "string",
                            enum: [
                              "wired",
                              "wireless"
                            ]
                          },
                          latency: {
                            type: "number"
                          }
                        }
                      }
                    }
                  }
                },
                groups: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: [
                      "id",
                      "label",
                      "nodes",
                      "color"
                    ],
                    properties: {
                      id: {
                        type: "string"
                      },
                      label: {
                        type: "string"
                      },
                      nodes: {
                        type: "array",
                        items: {
                          type: "string"
                        }
                      },
                      color: {
                        type: "string"
                      }
                    }
                  }
                },
                sourceNodeId: {
                  type: "string"
                },
                targetNodeId: {
                  type: "string"
                },
                explanation: {
                  type: "string"
                }
              }
            }
          }
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: data.error?.message || 'OpenAI API call failed' 
      }, { status: response.status });
    }

    const content = data.choices?.[0]?.message?.content;

    console.log("RAW GROQ OUTPUT:", content);

    if (!content) {
      throw new Error("Groq returned empty content");
    }

    const aiOutput = JSON.parse(content);

    console.log("PARSED AI OUTPUT:", aiOutput);

    // Basic Validation & Enforcement
    if (!aiOutput.nodes || !aiOutput.edges) {
      console.error("Missing nodes/edges:", aiOutput);
      throw new Error("Invalid AI Response format");
    }

    // Validate that every edge references an existing node
    const nodeIds = new Set(
      aiOutput.nodes.map((node: any) => node.id)
    );

    for (const edge of aiOutput.edges) {
      if (!nodeIds.has(edge.source)) {
        throw new Error(
          `Edge ${edge.id} references missing source node: ${edge.source}`
        );
      }

      if (!nodeIds.has(edge.target)) {
        throw new Error(
          `Edge ${edge.id} references missing target node: ${edge.target}`
        );
      }
    }

    // Validate that there are no isolated nodes
    const connectedNodes = new Set<string>();

    for (const edge of aiOutput.edges) {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    }

    const isolatedNodes = aiOutput.nodes.filter(
      (node: any) => !connectedNodes.has(node.id)
    );

    if (isolatedNodes.length > 0) {
      throw new Error(
        `Topology contains isolated nodes: ${isolatedNodes
          .map((node: any) => node.data.label)
          .join(", ")}`
      );
    }

    // Validate source and target node IDs
    if (!nodeIds.has(aiOutput.sourceNodeId)) {
      throw new Error("Invalid sourceNodeId");
    }

    if (!nodeIds.has(aiOutput.targetNodeId)) {
      throw new Error("Invalid targetNodeId");
    }

    // Auto-layout if AI provided 0,0 for all nodes
    const finalNodes = aiOutput.nodes.map((node: any, idx: number) => {
      if (node.position?.x === 0 && node.position?.y === 0) {
        return {
          ...node,
          position: {
            x: (idx % 3) * 300,
            y: Math.floor(idx / 3) * 200
          }
        };
      }

      return node;
    });

    return NextResponse.json({
      ...aiOutput,
      nodes: finalNodes
    });

  } catch (error: any) {
    console.error("API Error:", error);

    return NextResponse.json({ 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
