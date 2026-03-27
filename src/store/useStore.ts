import { Node, Edge } from '@xyflow/react';
import { create } from 'zustand';
import {
  Connection,
  EdgeChange,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { runRoutingAlgorithm, getEdgeBetween, RoutingAlgorithm } from '@/utils/routing';
import { predefinedTopologies } from '@/data/topologies';

export interface Packet {
  id: string;
  sourceId: string;
  targetId: string;
  path: string[];
  currentEdgeIndex: number;
  isReversed: boolean;
  currentEdgeId: string;
  progress: number;
  velocity: number;
  status: 'in-transit' | 'dropped' | 'arrived';
  createdAt: number;
  droppedAt?: number;
  packetType?: 'video' | 'api' | 'db';
}

export interface NetworkEvent {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface Metrics {
  totalSent: number;
  totalDelivered: number;
  totalDropped: number;
  avgLatency: number;
}

export interface NetworkState {
  nodes: Node[];
  edges: Edge[];
  packets: Packet[];
  streamActive: boolean;

  selectedSourceId: string | null;
  selectedTargetId: string | null;
  routingAlgorithm: RoutingAlgorithm;
  playbackSpeed: number;
  alternateRouteAvailable: boolean;
  inspectedNodeId: string | null;
  events: NetworkEvent[];

  packetSpawnTimer: number;
  spawnRate: number;
  metrics: Metrics;
  aiExplanation: string | null;
  alternatePaths: string[][];
  groups: any[];
  understandingSteps: { title: string, explanation: string, text?: string, nodes: string[] }[] | null;
  currentStepIndex: number;
  isUnderstanding: boolean;
  chatMessages: { role: 'user' | 'assistant', content: string }[];
  isChatLoading: boolean;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;

  loadTopology: (topologyId: string) => void;
  setRoutingAlgorithm: (algo: RoutingAlgorithm) => void;
  setPlaybackSpeed: (speed: number) => void;
  setSelectedSourceId: (id: string | null) => void;
  setSelectedTargetId: (id: string | null) => void;
  setInspectedNodeId: (id: string | null) => void;
  updateNodeData: (nodeId: string, payload: any) => void;
  addEvent: (message: string, type?: NetworkEvent['type']) => void;

  startAutoDemo: () => void;
  triggerScenario: (scenarioType: string) => void;
  toggleStream: () => void;
  recalculatePaths: () => void;
  updateHighlightedPath: () => void;
  tick: (deltaTime: number) => void;
  createDefaultTopology: () => void;
  applyAiTopology: (topology: { nodes: Node[], edges: Edge[], groups?: any[], explanation: string, sourceNodeId?: string, targetNodeId?: string }) => void;
  applyTopologyChanges: (changes: { addNodes?: any[], removeNodes?: string[], updateEdges?: any[] }) => void;
  restructureTopology: (topology: { nodes: Node[], edges: Edge[], groups?: any[] }) => boolean;
  setUnderstanding: (steps: any[] | null) => void;
  setCurrentStepIndex: (index: number) => void;
  setIsUnderstanding: (loading: boolean) => void;
  sendChatMessage: (message: string) => void;
  isNodeInCurrentStep: (nodeId: string) => boolean;
}

const useStore = create<NetworkState>((set, get) => ({
  nodes: [],
  edges: [],
  packets: [],
  streamActive: false,
  selectedSourceId: null,
  selectedTargetId: null,
  routingAlgorithm: 'dijkstra',
  playbackSpeed: 1,
  alternateRouteAvailable: false,
  inspectedNodeId: null,
  events: [],

  packetSpawnTimer: 0,
  spawnRate: 300,
  metrics: {
    totalSent: 0, totalDelivered: 0, totalDropped: 0, avgLatency: 0,
  },
  aiExplanation: null,
  alternatePaths: [],
  groups: [],
  understandingSteps: null,
  currentStepIndex: -1,
  isUnderstanding: false,
  chatMessages: [],
  isChatLoading: false,

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setInspectedNodeId: (id) => set({ inspectedNodeId: id }),

  setRoutingAlgorithm: (algo) => {
    set({ routingAlgorithm: algo });
    get().recalculatePaths();
  },

  setSelectedSourceId: (id) => {
    set({ selectedSourceId: id });
    get().updateHighlightedPath();
  },

  setSelectedTargetId: (id) => {
    set({ selectedTargetId: id });
    get().updateHighlightedPath();
  },

  addEvent: (message, type = 'info') => {
    set(state => ({
      events: [{ id: Math.random().toString(), timestamp: Date.now(), message, type } as NetworkEvent, ...state.events].slice(0, 50)
    }));
  },

  startAutoDemo: () => {
    get().loadTopology('internet');
    get().setRoutingAlgorithm('bfs');
    if (!get().streamActive) get().toggleStream();

    get().addEvent('Auto-Demo: Initialized Internet Architecture tracing.', 'success');
    get().addEvent('Protocol Executing: Breadth-First-Search (Lowest Hop Count, High Latency).', 'info');

    setTimeout(() => {
      get().setRoutingAlgorithm('dijkstra');
      get().addEvent('Auto-Demo Shift: Re-calculated Pathing via Dijkstra (Optimized Lowest Latency)', 'success');
    }, 6000);

    setTimeout(() => {
      get().triggerScenario('router_failure');
      get().addEvent('CRITICAL ERROR: Backbone Core Router Hardware Failure Detacted!', 'error');
      get().addEvent('Autonomous Rerouting Subsystems Activated natively tracing redundancy paths.', 'warning');
    }, 12000);

    setTimeout(() => {
      get().triggerScenario('high_congestion');
      get().addEvent('WARNING: Edge ISP nodes saturated. Network Velocity forcibly scaled down automatically due to congestion.', 'warning');
    }, 18000);
  },

  updateNodeData: (nodeId, payload) => {
    set(state => ({
      nodes: state.nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...payload } } : n)
    }));
    get().recalculatePaths();
  },

  triggerScenario: (scenarioType) => {
    set(state => {
      const updatedNodes = state.nodes.map(n => {
        let newData = { ...n.data, status: 'online', dropRate: 0 };
        const label = String(n.data?.label).toLowerCase();

        if (scenarioType === 'router_failure') {
          if (label.includes('router') || label.includes('core')) {
            if (Math.random() > 0.6) newData.status = 'offline';
          }
        } else if (scenarioType === 'high_congestion') {
          if (label.includes('router') || label.includes('isp')) newData.status = 'congested';
        } else if (scenarioType === 'packet_loss_attack') {
          if (label.includes('sw') || label.includes('edge')) newData.dropRate = 0.4;
        }
        return { ...n, data: newData };
      });
      return { nodes: updatedNodes };
    });
    get().recalculatePaths();
  },

  loadTopology: (topologyId) => {
    const topo = predefinedTopologies.find(t => t.id === topologyId);
    if (!topo) return;
    set({
      nodes: topo.nodes,
      edges: topo.edges,
      streamActive: false,
      packets: [],
      routingAlgorithm: topo.recommendedAlgo,
      metrics: { totalSent: 0, totalDelivered: 0, totalDropped: 0, avgLatency: 0 },
      selectedSourceId: topo.nodes.find(n => String(n.data?.label).toLowerCase().includes('pc'))?.id || null,
      selectedTargetId: topo.nodes.find(n => String(n.data?.label).toLowerCase().includes('server'))?.id || null,
    });
    get().updateHighlightedPath();
  },

  createDefaultTopology: () => {
    const { nodes } = get();
    if (nodes.length > 0) return;
    get().loadTopology('lan');
  },

  applyAiTopology: ({ nodes, edges, groups = [], explanation, sourceNodeId, targetNodeId }) => {
    const getLayer = (node: any) => {
      const type = node.data?.nodeType || 'pc';
      const label = (node.data?.label || '').toLowerCase();
      if (label.includes('internet')) return 3;
      if (type === 'pc' || type === 'mobile') return 0;
      if (type === 'wifi' || type === 'access_point') return 1;
      if (type === 'router' && !label.includes('core')) return 2;
      if (type === 'router' && label.includes('core')) return 4;
      if (type === 'server') return 5;
      return 2;
    };

    const layerWidth = 350;
    const nodeHeight = 150;
    const layerCounts: Record<number, number> = {};

    const positionedNodes = nodes.map((node) => {
      const layer = getLayer(node);
      const index = layerCounts[layer] || 0;
      layerCounts[layer] = index + 1;

      return {
        ...node,
        position: {
          x: layer * layerWidth,
          y: index * nodeHeight + 100
        }
      };
    });

    const groupNodes: Node[] = groups.map((group: any) => {
      const groupNodesList = positionedNodes.filter(n => group.nodes.includes(n.id));
      if (groupNodesList.length === 0) return null;

      const minX = Math.min(...groupNodesList.map(n => n.position.x));
      const maxX = Math.max(...groupNodesList.map(n => n.position.x));
      const minY = Math.min(...groupNodesList.map(n => n.position.y));
      const maxY = Math.max(...groupNodesList.map(n => n.position.y));

      return {
        id: `group_${group.id}`,
        type: 'groupNode',
        data: { label: group.label, color: group.color || '#10b981' },
        position: { x: minX - 50, y: minY - 80 },
        style: {
          width: (maxX - minX) + 200,
          height: (maxY - minY) + 180,
          pointerEvents: 'none',
          zIndex: -1
        }
      };
    }).filter(Boolean) as Node[];

    set({
      nodes: [...groupNodes, ...positionedNodes],
      edges,
      groups,
      aiExplanation: explanation,
      streamActive: false,
      packets: [],
      metrics: { totalSent: 0, totalDelivered: 0, totalDropped: 0, avgLatency: 0 },
      selectedSourceId: sourceNodeId || positionedNodes.find(n => getLayer(n) === 0)?.id || positionedNodes[0]?.id || null,
      selectedTargetId: targetNodeId || positionedNodes.find(n => getLayer(n) === 5)?.id || positionedNodes[positionedNodes.length - 1]?.id || null,
    });

    get().updateHighlightedPath();
    get().addEvent("Architecting Multi-Domain Network...", "info");

    setTimeout(() => {
      if (!get().streamActive) get().toggleStream();
    }, 1500);
  },

  applyTopologyChanges: ({ addNodes = [], removeNodes = [], updateEdges = [] }) => {
    const { nodes, edges, groups } = get();
    let newNodes = nodes.filter(n => !removeNodes.includes(n.id));
    let newEdges = edges.filter(e => !removeNodes.includes(e.source) && !removeNodes.includes(e.target));
    
    const processedNewNodes = addNodes.map(n => {
      const label = (n.data?.label || '').toLowerCase();
      const type = (n.data?.nodeType || '').toLowerCase();
      let targetGroup = groups.find(g => label.includes(g.label.toLowerCase()) || type.includes(g.label.toLowerCase()));

      let pos = n.position || { x: 400 + Math.random() * 200, y: 300 + Math.random() * 200 };
      if (targetGroup) {
        const groupNode = nodes.find(gn => gn.id === `group_${targetGroup.id}`);
        if (groupNode) {
          pos = {
            x: groupNode.position.x + 50 + Math.random() * 100,
            y: groupNode.position.y + 100 + Math.random() * 50
          };
        }
      }

      return {
        ...n,
        type: n.type || 'customNode',
        position: pos,
        data: { ...n.data, status: n.data?.status || 'online' }
      };
    });
    newNodes = [...newNodes, ...processedNewNodes];

    updateEdges.forEach(ue => {
      const existingIdx = newEdges.findIndex(e => e.id === ue.id);
      if (existingIdx !== -1) {
        newEdges[existingIdx] = { ...newEdges[existingIdx], ...ue };
      } else {
        newEdges.push({ ...ue, type: ue.type || 'custom' } as Edge);
      }
    });

    set({ nodes: newNodes, edges: newEdges });
    get().updateHighlightedPath();
    get().addEvent("Graph topology dynamically updated", "success");
  },

  restructureTopology: ({ nodes: newNodes, edges: newEdges, groups: newGroups = [] }) => {
    const { selectedSourceId, selectedTargetId } = get();
    
    const src = selectedSourceId && newNodes.find(n => n.id === selectedSourceId) ? selectedSourceId : newNodes[0]?.id;
    const dst = selectedTargetId && newNodes.find(n => n.id === selectedTargetId) ? selectedTargetId : newNodes[newNodes.length - 1]?.id;

    if (src && dst) {
      const path = runRoutingAlgorithm('bfs', newNodes, newEdges, src, dst);
      if (!path) {
          get().addEvent("Restructure Error: Generated graph is disconnected.", "error");
          return false;
      }
    }

    const layerMapping: Record<string, number> = { pc: 0, mobile: 0, wifi: 1, access_point: 1, router: 2, internet: 3, server: 5 };
    const layerWidth = 350;
    const nodeHeight = 150;
    const layerCounts: Record<number, number> = {};

    const positionedNodes = newNodes.map((node) => {
      const nodeData = node.data as any;
      const type = (nodeData?.nodeType as string) || 'pc';
      const label = (nodeData?.label as string || '').toLowerCase();
      let layer = layerMapping[type] ?? 2;
      if (label.includes('internet')) layer = 3;
      if (label.includes('core')) layer = 4;
      
      const index = layerCounts[layer] || 0;
      layerCounts[layer] = index + 1;
      
      return {
        ...node,
        type: node.type || 'customNode',
        position: { x: layer * layerWidth, y: index * nodeHeight + 100 }
      };
    });

    const groupNodes: Node[] = newGroups.map((group: any) => {
      const groupNodesList = positionedNodes.filter(n => group.nodes.includes(n.id));
      if (groupNodesList.length === 0) return null;
      const minX = Math.min(...groupNodesList.map(n => n.position.x));
      const maxX = Math.max(...groupNodesList.map(n => n.position.x));
      const minY = Math.min(...groupNodesList.map(n => n.position.y));
      const maxY = Math.max(...groupNodesList.map(n => n.position.y));
      return {
        id: `group_${group.id}`,
        type: 'groupNode',
        data: { label: group.label, color: group.color || '#10b981' },
        position: { x: minX - 50, y: minY - 80 },
        style: { width: (maxX - minX) + 200, height: (maxY - minY) + 180, pointerEvents: 'none', zIndex: -1 }
      };
    }).filter(Boolean) as Node[];

    set({ nodes: [...groupNodes, ...positionedNodes], edges: newEdges, groups: newGroups, selectedSourceId: src, selectedTargetId: dst });
    get().updateHighlightedPath();
    get().addEvent("Topology Restructured by AI Architect.", "success");
    return true;
  },

  setUnderstanding: (steps) => set({ understandingSteps: steps, currentStepIndex: steps ? 0 : -1 }),
  setCurrentStepIndex: (index) => set({ currentStepIndex: index }),
  setIsUnderstanding: (loading) => set({ isUnderstanding: loading }),

  isNodeInCurrentStep: (nodeId) => {
    const { understandingSteps, currentStepIndex } = get();
    if (!understandingSteps || currentStepIndex === -1) return true;
    return understandingSteps[currentStepIndex].nodes.includes(nodeId);
  },

  sendChatMessage: async (content) => {
    const { chatMessages, nodes, edges, groups, selectedSourceId, selectedTargetId, metrics, routingAlgorithm } = get();
    const newUserMsg = { role: 'user' as const, content };
    const newMessages = [...chatMessages, newUserMsg];
    set({ chatMessages: newMessages, isChatLoading: true });

    try {
      const response = await fetch('/api/chat-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: {
            nodes: nodes.filter(n => n.type !== 'groupNode'),
            edges,
            groups,
            sourceId: selectedSourceId,
            targetId: selectedTargetId,
            metrics,
            algorithm: routingAlgorithm
          }
        })
      });

      if (!response.ok) throw new Error("Chat failed");
      const data = await response.json();
      set({
        chatMessages: [...newMessages, { role: 'assistant' as const, content: data.content }],
        isChatLoading: false
      });
    } catch (error) {
      set({ isChatLoading: false });
      get().addEvent("Chat error, check console", "error");
    }
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
    get().recalculatePaths();
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
    get().recalculatePaths();
  },

  onConnect: (connection) => {
    const edge = { ...connection, type: 'custom' };
    set({ edges: addEdge(edge, get().edges) });
    get().recalculatePaths();
  },

  addNode: (node) => set({ nodes: [...get().nodes, node] }),

  toggleStream: () => {
    set(state => ({ streamActive: !state.streamActive }));
    get().updateHighlightedPath();
  },

  updateHighlightedPath: () => {
    set((state) => {
      const { selectedSourceId, selectedTargetId, nodes, edges, streamActive, routingAlgorithm } = state;
      const primaryPath = streamActive && selectedSourceId && selectedTargetId
        ? runRoutingAlgorithm(routingAlgorithm, nodes, edges, selectedSourceId, selectedTargetId)
        : null;

      const routeEdges = new Set<string>();
      const altEdges = new Set<string>();
      let alternatePaths: string[][] = [];

      if (primaryPath && primaryPath.length >= 2) {
        for (let i = 0; i < primaryPath.length - 1; i++) {
          const { edge } = getEdgeBetween(edges, primaryPath[i], primaryPath[i + 1]);
          if (edge) routeEdges.add(edge.id);
        }

        const { edge: firstEdge } = getEdgeBetween(edges, primaryPath[0], primaryPath[1]);
        if (firstEdge && selectedSourceId && selectedTargetId) {
          const reducedEdges = edges.filter(e => e.id !== firstEdge.id);
          const altPath = runRoutingAlgorithm(routingAlgorithm, nodes, reducedEdges, selectedSourceId as string, selectedTargetId as string);

          if (altPath && altPath.length >= 2) {
            alternatePaths.push(altPath);
            for (let i = 0; i < altPath.length - 1; i++) {
              const { edge } = getEdgeBetween(edges, altPath[i], altPath[i + 1]);
              if (edge && !routeEdges.has(edge.id)) altEdges.add(edge.id);
            }
          }
        }
      }

      let changed = false;
      const newEdges = edges.map(e => {
        const shouldGlow = routeEdges.has(e.id);
        const shouldDim = altEdges.has(e.id);
        if (e.data?.isGlowing !== shouldGlow || e.data?.isDimmed !== shouldDim) {
          changed = true;
          return { ...e, data: { ...e.data, isGlowing: shouldGlow, isDimmed: shouldDim } };
        }
        return e;
      });

      return changed || (state.alternatePaths.length !== alternatePaths.length)
        ? { edges: newEdges, alternatePaths, alternateRouteAvailable: alternatePaths.length > 0 }
        : {};
    });
  },

  recalculatePaths: () => {
    set((state) => {
      let graphChanged = false;
      const newPackets = state.packets.map(packet => {
        if (packet.status !== 'in-transit') return packet;
        const nextNodeId = packet.path[packet.currentEdgeIndex + 1];
        if (!nextNodeId) return packet;

        const pathFromNextNode = runRoutingAlgorithm(state.routingAlgorithm, state.nodes, state.edges, nextNodeId, packet.targetId);
        if (!pathFromNextNode) {
          graphChanged = true;
          return { ...packet, status: 'dropped' as const, droppedAt: Date.now() };
        }

        const currentNodeId = packet.path[packet.currentEdgeIndex];
        const newPath = [currentNodeId, ...pathFromNextNode];
        if (newPath.join(',') !== packet.path.join(',')) {
          graphChanged = true;
          return { ...packet, path: newPath };
        }
        return packet;
      });
      return graphChanged ? { packets: newPackets } : {};
    });
    get().updateHighlightedPath();
  },

  tick: (deltaTime: number) => {
    set((state) => {
      let { packetSpawnTimer, metrics, streamActive, nodes, edges, selectedSourceId, selectedTargetId, routingAlgorithm, playbackSpeed } = state;
      const newPackets = [...state.packets];

      if (streamActive && selectedSourceId && selectedTargetId) {
        packetSpawnTimer += (deltaTime * playbackSpeed);
        if (packetSpawnTimer >= state.spawnRate) {
          packetSpawnTimer = 0;
          const path = runRoutingAlgorithm(routingAlgorithm, nodes, edges, selectedSourceId, selectedTargetId);
          if (path && path.length >= 2) {
            const { edge, isReversed } = getEdgeBetween(edges, path[0], path[1]);
            if (edge) {
              metrics = { ...metrics, totalSent: metrics.totalSent + 1 };
              const pTypeRoll = Math.random();
              const packetType = pTypeRoll > 0.7 ? 'video' : pTypeRoll > 0.4 ? 'api' : 'db';

              newPackets.push({
                id: `pkt_${Date.now()}_${Math.random()}`,
                sourceId: selectedSourceId,
                targetId: selectedTargetId,
                path,
                currentEdgeIndex: 0,
                isReversed,
                currentEdgeId: edge.id,
                progress: 0,
                velocity: 0.0015,
                status: 'in-transit',
                createdAt: Date.now(),
                packetType
              });
            }
          }
        }
      }

      const finalPackets: Packet[] = [];
      let newMetrics = { ...metrics };

      for (let i = 0; i < newPackets.length; i++) {
        const packet = newPackets[i];
        if (packet.status === 'dropped') {
          if (Date.now() - (packet.droppedAt || Date.now()) > 500) continue;
          finalPackets.push(packet);
          continue;
        }
        if (packet.status === 'arrived') continue;

        const targetNodeId = packet.path[packet.currentEdgeIndex + 1];
        const targetNode = nodes.find(n => n.id === targetNodeId);
        const currentEdge = edges.find(e => e.id === packet.currentEdgeId);
        const isWireless = currentEdge?.data?.edgeType === 'wireless';

        const jitter = isWireless
          ? (0.5 + (Math.random() * 0.8))
          : (0.9 + (Math.random() * 0.2));

        const congestionModifier = targetNode?.data?.status === 'congested' ? 0.3 : 1;
        const finalVelocity = packet.velocity * jitter * congestionModifier;
        const newProgress = packet.progress + (finalVelocity * deltaTime * playbackSpeed);

        if (newProgress >= 1) {
          let dropRate = typeof targetNode?.data?.dropRate === 'number' ? targetNode.data.dropRate : 0;
          if (isWireless) {
            const wirelessLoss = typeof currentEdge?.data?.packetLoss === 'number' ? currentEdge.data.packetLoss : 0.1;
            dropRate = Math.max(dropRate, wirelessLoss);
          }

          if (dropRate > 0 && Math.random() < dropRate) {
            newMetrics.totalDropped++;
            finalPackets.push({ ...packet, status: 'dropped', droppedAt: Date.now() });
            continue;
          }

          const nextIndex = packet.currentEdgeIndex + 1;
          if (nextIndex >= packet.path.length - 1) {
            const latency = Date.now() - packet.createdAt;
            newMetrics.totalDelivered++;
            newMetrics.avgLatency = newMetrics.avgLatency === 0
              ? latency
              : (newMetrics.avgLatency * 0.9) + (latency * 0.1);
            continue;
          }

          const nodeA = packet.path[nextIndex];
          const nodeB = packet.path[nextIndex + 1];
          const { edge, isReversed } = getEdgeBetween(edges, nodeA, nodeB);

          if (!edge) {
            newMetrics.totalDropped++;
            finalPackets.push({ ...packet, status: 'dropped', droppedAt: Date.now() });
            continue;
          }

          finalPackets.push({
            ...packet,
            progress: Math.max(0, newProgress - 1),
            currentEdgeIndex: nextIndex,
            currentEdgeId: edge.id,
            isReversed
          });
        } else {
          finalPackets.push({ ...packet, progress: newProgress });
        }
      }

      return { packets: finalPackets, packetSpawnTimer, metrics: newMetrics };
    });
  }
}));

export default useStore;
