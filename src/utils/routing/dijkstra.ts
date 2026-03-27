import { Node, Edge } from '@xyflow/react';

/**
 * Executes Dijkstra's shortest path algorithm over the React Flow active graph.
 * @returns Array of Node IDs representing the exact shortest path, or null if absolutely physically unreachable.
 */
export function getShortestPath(nodes: Node[], edges: Edge[], sourceId: string, targetId: string): string[] | null {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited: Set<string> = new Set();
  
  // 1. Initialize Map
  for (const node of nodes) {
    // If a node is strictly 'offline', we literally pretend it doesn't exist in the physical routing table
    if (node.data?.status === 'offline') continue;
    
    distances[node.id] = Infinity;
    previous[node.id] = null;
    unvisited.add(node.id);
  }
  
  if (!unvisited.has(sourceId) || !unvisited.has(targetId)) return null;
  
  distances[sourceId] = 0;
  
  // 2. Compute minimum paths
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
    if (currentNode === targetId) break; // Reached target brilliantly fast
    
    unvisited.delete(currentNode);
    
    // Find all edges connected directly to this node (Bidirectional mapping)
    const neighborEdges = edges.filter(e => e.source === currentNode || e.target === currentNode);
    
    for (const edge of neighborEdges) {
      const neighborId = edge.source === currentNode ? edge.target : edge.source;
      
      if (!unvisited.has(neighborId)) continue;
      
      // Pull edge latency weight physically from properties if it exists, otherwise assume perfect 1 cost
      const weight = typeof edge.data?.latency === 'number' ? edge.data.latency : 1;
      const alt = distances[currentNode] + weight;
      
      if (alt < distances[neighborId]) {
        distances[neighborId] = alt;
        previous[neighborId] = currentNode;
      }
    }
  }
  
  // 3. Reconstruct linear array path
  const path: string[] = [];
  let current: string | null = targetId;
  
  if (previous[current] !== null || current === sourceId) {
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }
    return path;
  }
  
  // Graph topology is physically broken; dead end isolated.
  return null;
}

/**
 * Given two adjacent nodes natively, returns the exact React Flow Edge connecting them AND 
 * whether the packet is traveling 'backwards' against the drawn vector line.
 */
export function getEdgeBetween(edges: Edge[], nodeA: string, nodeB: string): { edge: Edge | undefined, isReversed: boolean } {
  let edge = edges.find(e => e.source === nodeA && e.target === nodeB);
  if (edge) return { edge, isReversed: false };
  
  // Try reversed lookup (packet travelling from Target -> Source physically)
  edge = edges.find(e => e.source === nodeB && e.target === nodeA);
  return { edge, isReversed: true };
}
