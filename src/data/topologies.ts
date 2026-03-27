import { Node, Edge } from '@xyflow/react';
import { RoutingAlgorithm } from '@/utils/routing';

export type TopologyDef = {
  id: string;
  name: string;
  recommendedAlgo: RoutingAlgorithm;
  nodes: Node[];
  edges: Edge[];
};

const createEdge = (source: string, target: string, latency: number): Edge => ({
  id: `e_${source}_${target}`,
  source,
  target,
  type: 'custom',
  data: { latency }
});

export const predefinedTopologies: TopologyDef[] = [
  {
    id: 'enterprise',
    name: 'Enterprise Architecture (Redundant Core)',
    recommendedAlgo: 'dijkstra',
    nodes: [
      { id: 'pc1', type: 'customNode', position: { x: 50, y: 150 }, data: { label: 'PC-HR' } },
      { id: 'pc2', type: 'customNode', position: { x: 50, y: 450 }, data: { label: 'PC-Dev' } },
      { id: 'sw1', type: 'customNode', position: { x: 250, y: 150 }, data: { label: 'Switch-A' } },
      { id: 'sw2', type: 'customNode', position: { x: 250, y: 450 }, data: { label: 'Switch-B' } },
      { id: 'r1', type: 'customNode', position: { x: 500, y: 150 }, data: { label: 'Router-Primary' } },
      { id: 'r2', type: 'customNode', position: { x: 500, y: 450 }, data: { label: 'Router-Backup' } },
      { id: 'gw', type: 'customNode', position: { x: 750, y: 300 }, data: { label: 'Gateway' } },
      { id: 'srv', type: 'customNode', position: { x: 950, y: 300 }, data: { label: 'Server-Database' } }
    ],
    edges: [
      createEdge('pc1', 'sw1', 1),
      createEdge('pc2', 'sw2', 1),
      createEdge('sw1', 'r1', 5), // Fast primary link
      createEdge('sw1', 'r2', 20), // Slower redundant cross-link
      createEdge('sw2', 'r2', 5),
      createEdge('sw2', 'r1', 20),
      createEdge('r1', 'gw', 5),
      createEdge('r2', 'gw', 15),
      createEdge('r1', 'r2', 10), // Inter-router loop
      createEdge('gw', 'srv', 5)
    ]
  },
  {
    id: 'internet',
    name: 'Global Internet (BGP Backbone)',
    recommendedAlgo: 'ospf',
    nodes: [
      { id: 'client', type: 'customNode', position: { x: 50, y: 300 }, data: { label: 'PC-Client' } },
      { id: 'isp1', type: 'customNode', position: { x: 250, y: 150 }, data: { label: 'ISP-Seattle' } },
      { id: 'isp2', type: 'customNode', position: { x: 250, y: 450 }, data: { label: 'ISP-LA' } },
      { id: 'core1', type: 'customNode', position: { x: 500, y: 100 }, data: { label: 'Core-Chicago' } },
      { id: 'core2', type: 'customNode', position: { x: 500, y: 300 }, data: { label: 'Core-Texas' } },
      { id: 'core3', type: 'customNode', position: { x: 500, y: 500 }, data: { label: 'Core-Atlanta' } },
      { id: 'dc_gw', type: 'customNode', position: { x: 750, y: 300 }, data: { label: 'DC-Gateway' } },
      { id: 'server', type: 'customNode', position: { x: 950, y: 300 }, data: { label: 'Server-AWS' } },
    ],
    edges: [
      createEdge('client', 'isp1', 10),
      createEdge('client', 'isp2', 20),
      // ISP -> Core (Notice isp2->core2 is geographically 1-hop but 150ms latency vs multi-hop)
      createEdge('isp1', 'core1', 30),
      createEdge('isp1', 'core2', 40),
      createEdge('isp2', 'core2', 150), // Massive latency! BFS will take this, Dijkstra won't!
      createEdge('isp2', 'core3', 20),
      // Core interconnects
      createEdge('core1', 'core2', 10),
      createEdge('core2', 'core3', 10),
      // Core -> DC
      createEdge('core1', 'dc_gw', 20),
      createEdge('core2', 'dc_gw', 15),
      createEdge('core3', 'dc_gw', 25),
      createEdge('dc_gw', 'server', 5)
    ]
  },
  {
    id: 'loadbalancer',
    name: 'High-Traffic Load Balancer',
    recommendedAlgo: 'round_robin',
    nodes: [
      { id: 'pc1', type: 'customNode', position: { x: 50, y: 200 }, data: { label: 'PC-Client-1' } },
      { id: 'pc2', type: 'customNode', position: { x: 50, y: 400 }, data: { label: 'PC-Client-2' } },
      { id: 'lb', type: 'customNode', position: { x: 300, y: 300 }, data: { label: 'Load-Balancer' } },
      { id: 's1', type: 'customNode', position: { x: 600, y: 100 }, data: { label: 'Server-Node-A' } },
      { id: 's2', type: 'customNode', position: { x: 600, y: 300 }, data: { label: 'Server-Node-B' } },
      { id: 's3', type: 'customNode', position: { x: 600, y: 500 }, data: { label: 'Server-Node-C' } },
      { id: 'db', type: 'customNode', position: { x: 900, y: 300 }, data: { label: 'Server-DB-Cluster' } },
    ],
    edges: [
      createEdge('pc1', 'lb', 10),
      createEdge('pc2', 'lb', 10),
      createEdge('lb', 's1', 5),
      createEdge('lb', 's2', 5),
      createEdge('lb', 's3', 5),
      createEdge('s1', 'db', 2),
      createEdge('s2', 'db', 2),
      createEdge('s3', 'db', 2),
    ]
  },
  {
    id: 'microservices',
    name: 'Cloud Microservices (API Mesh)',
    recommendedAlgo: 'random',
    nodes: [
      { id: 'pc', type: 'customNode', position: { x: 50, y: 300 }, data: { label: 'PC-Mobile' } },
      { id: 'cdn', type: 'customNode', position: { x: 250, y: 300 }, data: { label: 'CDN-Edge' } },
      { id: 'api', type: 'customNode', position: { x: 450, y: 300 }, data: { label: 'API-Gateway' } },
      { id: 'auth1', type: 'customNode', position: { x: 650, y: 150 }, data: { label: 'Auth-Service-A' } },
      { id: 'auth2', type: 'customNode', position: { x: 650, y: 300 }, data: { label: 'Auth-Service-B' } },
      { id: 'app1', type: 'customNode', position: { x: 650, y: 450 }, data: { label: 'Worker-Node-1' } },
      { id: 'db1', type: 'customNode', position: { x: 900, y: 150 }, data: { label: 'Server-DB-Primary' } },
      { id: 'db2', type: 'customNode', position: { x: 900, y: 350 }, data: { label: 'Server-DB-Replica' } },
    ],
    edges: [
      createEdge('pc', 'cdn', 5),
      createEdge('pc', 'api', 50), // Represents a CA bypass
      createEdge('cdn', 'api', 10), 
      createEdge('api', 'auth1', 5),
      createEdge('api', 'auth2', 5),
      createEdge('auth1', 'app1', 5),
      createEdge('auth2', 'app1', 5),
      createEdge('api', 'app1', 15), // Direct app access?
      createEdge('auth1', 'db1', 2),
      createEdge('app1', 'db1', 2),
      createEdge('app1', 'db2', 5),
      createEdge('db1', 'db2', 1), // DB sync
    ]
  }
];
