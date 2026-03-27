import { Node, Edge } from '@xyflow/react';

export function getBFSPath(nodes: Node[], edges: Edge[], sourceId: string, targetId: string): string[] | null {
  const queue: string[] = [sourceId];
  const visited: Set<string> = new Set([sourceId]);
  const previous: Record<string, string | null> = { [sourceId]: null };

  const validNodes = new Set(nodes.filter(n => n.data?.status !== 'offline').map(n => n.id));
  if (!validNodes.has(sourceId) || !validNodes.has(targetId)) return null;

  while (queue.length > 0) {
    const currentNode = queue.shift()!;
    if (currentNode === targetId) break;

    // Retrieve all links touching this exact current vertex
    const neighborEdges = edges.filter(e => e.source === currentNode || e.target === currentNode);
    
    for (const edge of neighborEdges) {
      const neighborId = edge.source === currentNode ? edge.target : edge.source;
      
      if (!visited.has(neighborId) && validNodes.has(neighborId)) {
        visited.add(neighborId);
        previous[neighborId] = currentNode;
        queue.push(neighborId);
        
        // Fast-fail exit map
        if (neighborId === targetId) {
          queue.length = 0; 
          break;
        }
      }
    }
  }

  if (previous[targetId] !== undefined) {
    const path: string[] = [];
    let current: string | null = targetId;
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }
    return path;
  }
  
  return null;
}
