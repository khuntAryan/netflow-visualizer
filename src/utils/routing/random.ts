import { Node, Edge } from '@xyflow/react';

// Randomly picks a pseudo-chaotic path by wandering node-to-node (DFS style)
export function getRandomPath(nodes: Node[], edges: Edge[], sourceId: string, targetId: string): string[] | null {
  const path = [sourceId];
  const visited = new Set([sourceId]);
  
  let current = sourceId;
  const validNodes = new Set(nodes.filter(n => n.data?.status !== 'offline').map(n => n.id));
  
  if (!validNodes.has(sourceId) || !validNodes.has(targetId)) return null;

  // Prevent infinite mathematical loops by enforcing a TTL horizon
  for (let hop = 0; hop < 25; hop++) {
    if (current === targetId) return path;
    
    const neighborEdges = edges.filter(e => e.source === current || e.target === current);
    let neighbors = neighborEdges
      .map(e => e.source === current ? e.target : e.source)
      .filter(n => validNodes.has(n) && !visited.has(n));
                                 
    // Backtracking strategy: if hitting a dead end, allow re-visiting previous nodes (but avoid immediate ping-ponging)
    if (neighbors.length === 0) {
      const prev = path.length > 1 ? path[path.length - 2] : null;
      neighbors = neighborEdges
        .map(e => e.source === current ? e.target : e.source)
        .filter(n => validNodes.has(n) && n !== prev);
    }
                                 
    if (neighbors.length === 0) break; // Absolute physical quarantine zone
    
    // Pick chaotic neighbor
    const nextNode = neighbors[Math.floor(Math.random() * neighbors.length)];
    visited.add(nextNode);
    path.push(nextNode);
    current = nextNode;
  }
  
  if (path[path.length - 1] === targetId) return path;
  return null;
}
