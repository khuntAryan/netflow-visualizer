import { Node, Edge } from '@xyflow/react';
import { getShortestPath } from './dijkstra';

// Simulates native round-robin hardware load balancers distributing alternating payloads seamlessly
let roundRobinTicker = 0;

export function getRoundRobinPath(nodes: Node[], edges: Edge[], sourceId: string, targetId: string): string[] | null {
  roundRobinTicker++;
  
  const primaryPath = getShortestPath(nodes, edges, sourceId, targetId);
  if (!primaryPath || primaryPath.length < 3) return primaryPath;
  
  // Mathematically force alternating traffic slices across disparate links cleanly
  if (roundRobinTicker % 2 === 0) {
    const firstHopSource = primaryPath[0];
    const firstHopTarget = primaryPath[1];
    
    // Filter physical arrays forcing the engine to find the 'next-best' unencumbered pipeline natively
    const alternateEdges = edges.filter(e => 
      !(e.source === firstHopSource && e.target === firstHopTarget) &&
      !(e.source === firstHopTarget && e.target === firstHopSource)
    );
    
    const altPath = getShortestPath(nodes, alternateEdges, sourceId, targetId);
    if (altPath) return altPath; // Fallback mapping successful
  }
  
  return primaryPath; 
}
