import { Node, Edge } from '@xyflow/react';
import { getShortestPath as getDijkstraPath, getEdgeBetween } from './dijkstra';
import { getBFSPath } from './bfs';
import { getOSPFPath } from './ospf';
import { getRandomPath } from './random';
import { getRoundRobinPath } from './round_robin';

// Inherit Edge lookup map natively globally
export { getEdgeBetween };

export type RoutingAlgorithm = 'dijkstra' | 'bfs' | 'ospf' | 'random' | 'round_robin';

/**
 * Standardizes graph routing via abstracted architecture logic
 */
export function runRoutingAlgorithm(
  algo: RoutingAlgorithm, 
  nodes: Node[], 
  edges: Edge[], 
  sourceId: string, 
  targetId: string
): string[] | null {
  switch (algo) {
    case 'bfs':
      return getBFSPath(nodes, edges, sourceId, targetId);
    case 'ospf':
      return getOSPFPath(nodes, edges, sourceId, targetId);
    case 'random':
      return getRandomPath(nodes, edges, sourceId, targetId);
    case 'round_robin':
      return getRoundRobinPath(nodes, edges, sourceId, targetId);
    case 'dijkstra':
    default:
      return getDijkstraPath(nodes, edges, sourceId, targetId); // Standard dynamic topology evaluation
  }
}
