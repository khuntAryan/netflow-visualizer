# NetFlow Visualizer

An AI-assisted network simulation and visualization prototype. Describe a network in plain language, get an interactive topology, then send traffic through it and break it.

**Live demo:** https://netflow-visualizer.vercel.app

> **Status:** functional prototype, not a production deployment. No user numbers or performance benchmarks are claimed.

<!-- TODO: add a screenshot or short GIF of the demo here, e.g. ![NetFlow Visualizer](docs/screenshot.png) -->

## What it does

- **Generate a topology from a description.** Type an architecture in natural language. The app asks an LLM for nodes, edges (with latency), groups, and a source and target, then renders an interactive graph.
- **Start from templates.** Preloaded topologies such as "Enterprise Architecture (Redundant Core)" and "Cloud Microservices (API Mesh)".
- **Simulate traffic.** Watch packets flow along routes at adjustable speed (0.5x to 4x), with live telemetry for throughput, packet loss, and average latency.
- **Route with different algorithms.** BFS, Dijkstra, a simplified OSPF simulation, random, and round-robin.
- **Inject failures.** A "Chaos Engine" lets you congest links, kill nodes, and restore the base topology.
- **Ask the AI assistant.** Chat about the topology, request changes in plain language (the app classifies a request as an explanation or a topology change), and get step-by-step explanations of how traffic flows.
- **Export to Cisco-style configuration.** Generates structured export data with IOS-style CLI snippets (hostnames, interface addresses, OSPF settings, VLANs) and a markdown deployment guide. This is structured output, not a Packet Tracer file.

## Tech stack

- Next.js 16 (App Router and API routes), React 19, TypeScript
- Tailwind CSS 4
- Zustand for state, React Flow (`@xyflow/react`) for the graph, lucide-react for icons
- Groq API (`llama-3.3-70b-versatile`) for the AI features

## Getting started

```bash
git clone https://github.com/khuntAryan/netflow-visualizer.git
cd netflow-visualizer
npm install
```

The AI features call the Groq API and need a key. Create a `.env.local` file:

```bash
GROQ_API_KEY=your_key_here
```

Then run:

```bash
npm run dev
```

Open http://localhost:3000. Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Project structure

```
src/app/api/               generate-network, chat-network, explain-network, interact-network (Groq-backed routes)
src/components/            NetworkCanvas, Sidebar, AiAssistant, AiExplainer, CiscoExportModal, CustomNode, CustomEdge
src/utils/routing/         bfs, dijkstra, ospf, random, round_robin
src/utils/ciscoExport.ts   Cisco-style export generator
src/hooks/useSimulationEngine.ts   simulation engine
src/store/useStore.ts      Zustand store
src/data/topologies.ts     topology data
```

## Limitations

- This is a prototype. OSPF here is a simplified simulation, not a full protocol implementation.
- Generated topologies come from an LLM, so review them before relying on them.
