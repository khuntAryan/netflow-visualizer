import { Node, Edge } from '@xyflow/react';

export function getOSPFPath(nodes: Node[], edges: Edge[], sourceId: string, targetId: string): string[] | null {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited: Set<string> = new Set();
  
  for (const node of nodes) {
    if (node.data?.status === 'offline') continue;
    distances[node.id] = Infinity;
    previous[node.id] = null;
    unvisited.add(node.id);
  }
  
  if (!unvisited.has(sourceId) || !unvisited.has(targetId)) return null;
  distances[sourceId] = 0;
  
  while (unvisited.size > 0) {
    let currentNode: string | null = null;
    let minDistance = Infinity;
    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        currentNode = nodeId;
      }
    }
    
    if (currentNode === null || minDistance === Infinity) break;
    if (currentNode === targetId) break;
    unvisited.delete(currentNode);
    
    const neighborEdges = edges.filter(e => e.source === currentNode || e.target === currentNode);
    
    for (const edge of neighborEdges) {
      const neighborId = edge.source === currentNode ? edge.target : edge.source;
      if (!unvisited.has(neighborId)) continue;
      
      // Strict OSPF Simulation: We aggressively penalize heavy latencies natively
      const rawLatency = typeof edge.data?.latency === 'number' ? edge.data.latency : 10;
      const weight = rawLatency * 10; 
      
      const alt = distances[currentNode] + weight;
      if (alt < distances[neighborId]) {
        distances[neighborId] = alt;
        previous[neighborId] = currentNode;
      }
    }
  }
  
  const path: string[] = [];
  let current: string | null = targetId;
  if (previous[current] !== null || current === sourceId) {
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }
    return path;
  }
  return null;
}
