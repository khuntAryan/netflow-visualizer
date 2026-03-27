"use client";

import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  Panel,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useStore from '@/store/useStore';
import CustomEdge from '@/components/CustomEdge';
import CustomNode from '@/components/CustomNode';
import AiExplainer from '@/components/AiExplainer';
import { useSimulationEngine } from '@/hooks/useSimulationEngine';
import { predefinedTopologies } from '@/data/topologies';
import { runRoutingAlgorithm, getEdgeBetween } from '@/utils/routing';

let id = Date.now();
const getId = () => `node_${id++}`;

function DnDFlow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const packets = useStore((state) => state.packets);
  const metrics = useStore(state => state.metrics);
  
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const onConnect = useStore((state) => state.onConnect);
  const addNode = useStore((state) => state.addNode);
  const createDefaultTopology = useStore((state) => state.createDefaultTopology);
  
  const selectedSourceId = useStore((state) => state.selectedSourceId);
  const selectedTargetId = useStore((state) => state.selectedTargetId);
  const setSelectedSourceId = useStore((state) => state.setSelectedSourceId);
  const setSelectedTargetId = useStore((state) => state.setSelectedTargetId);
  
  const streamActive = useStore((state) => state.streamActive);
  const toggleStream = useStore((state) => state.toggleStream);

  const routingAlgorithm = useStore((state) => state.routingAlgorithm);
  const setRoutingAlgorithm = useStore((state) => state.setRoutingAlgorithm);
  
  const alternatePaths = useStore((state) => state.alternatePaths);
  const alternateRouteAvailable = useStore((state) => state.alternateRouteAvailable);
  
  const playbackSpeed = useStore((state) => state.playbackSpeed);
  const setPlaybackSpeed = useStore((state) => state.setPlaybackSpeed);
  
  const loadTopology = useStore((state) => state.loadTopology);

  const triggerScenario = useStore((state) => state.triggerScenario);
  const startAutoDemo = useStore((state) => state.startAutoDemo);
  const events = useStore((state) => state.events);
  
  const inspectedNodeId = useStore((state) => state.inspectedNodeId);
  const setInspectedNodeId = useStore((state) => state.setInspectedNodeId);
  const updateNodeData = useStore((state) => state.updateNodeData);

  const [throughput, setThroughput] = useState(0);
  const prevDeliveredRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = useStore.getState().metrics.totalDelivered;
      setThroughput(current - prevDeliveredRef.current);
      prevDeliveredRef.current = current;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    createDefaultTopology();
  }, [createDefaultTopology]);

  useSimulationEngine();

  const nodeTypes = useMemo(() => ({ 
    customNode: CustomNode, 
    groupNode: CustomNode, // Handles both via the NodeRenderer in CustomNode.tsx
    default: CustomNode 
  }), []);
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/nodeLabel') || type;
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX, y: event.clientY,
      });

      const newNode: Node = {
        id: getId(), 
        type: 'customNode', 
        position, 
        data: { label, status: 'online', dropRate: 0, nodeType: type },
      };
      addNode(newNode);
    },
    [reactFlowInstance, addNode]
  );
  
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setInspectedNodeId(node.id);
  }, [setInspectedNodeId]);
  
  const onPaneClick = useCallback(() => {
    setInspectedNodeId(null);
  }, [setInspectedNodeId]);

  const eligibleSources = nodes.filter(n => typeof n.data?.label === 'string' && n.data.label.toLowerCase().includes('pc'));
  const eligibleTargets = nodes.filter(n => typeof n.data?.label === 'string' && n.data.label.toLowerCase().includes('server'));

  const sourceLabel = String(nodes.find(n => n.id === selectedSourceId)?.data?.label || 'Source');
  const targetLabel = String(nodes.find(n => n.id === selectedTargetId)?.data?.label || 'Target');
  const packetLoss = metrics.totalSent > 0 ? Math.round((metrics.totalDropped / metrics.totalSent) * 100) : 0;
  
  const inspectedNode = nodes.find(n => n.id === inspectedNodeId);

  return (
    <div className="flex-grow h-full bg-[#0a0a0a]" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        colorMode="dark"
      >
        <Controls className="bg-gray-800 border-gray-700 fill-white" />
        <Background gap={16} color="#333" />
        
        <Panel position="top-center" className="mt-4 pointer-events-none">
          {streamActive && sourceLabel && targetLabel && (
            <div className="bg-black/60 border border-emerald-500/50 backdrop-blur-md px-6 py-2 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-3 transition-all duration-300">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-mono text-emerald-100 font-bold tracking-wider text-sm drop-shadow-md">
                {(sourceLabel as string) || "Source"} <span className="text-emerald-500/80 mx-2">→</span> {(targetLabel as string) || "Target"}
              </span>
              {alternatePaths.length > 0 && (
                <span className="ml-2 px-2.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/50 text-blue-300 text-[10px] uppercase font-bold tracking-wider shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                  {alternatePaths.length} Alternate {alternatePaths.length === 1 ? 'Route' : 'Routes'} Detected
                </span>
              )}
            </div>
          )}
        </Panel>

        <Panel position="bottom-center" className="mb-4 pointer-events-auto">
           <AiExplainer />
        </Panel>

        <Panel position="top-left" className="m-4 flex flex-col gap-3">
          
          <div className="flex bg-gray-900/90 backdrop-blur border border-gray-800 p-3 rounded-lg gap-3 items-center shadow-2xl">
            <select 
              value={selectedSourceId || ''} 
              onChange={e => setSelectedSourceId(e.target.value)}
              className="bg-gray-800 rounded px-2 py-1.5 text-emerald-400 border border-emerald-500/30 w-36 outline-none text-sm cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <option value="" disabled>Select Source</option>
              {eligibleSources.map(pc => <option key={pc.id} value={pc.id}>{String(pc.data.label)}</option>)}
            </select>

            <span className="text-gray-500 font-bold">→</span>

            <select 
              value={selectedTargetId || ''} 
              onChange={e => setSelectedTargetId(e.target.value)}
              className="bg-gray-800 rounded px-2 py-1.5 text-purple-400 border border-purple-500/30 w-36 outline-none text-sm cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <option value="" disabled>Select Target</option>
              {eligibleTargets.map(s => <option key={s.id} value={s.id}>{String(s.data.label)}</option>)}
            </select>
          </div>

          <button 
            onClick={toggleStream}
            disabled={!selectedSourceId || !selectedTargetId || selectedSourceId === selectedTargetId}
            className={`disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-lg shadow-lg border flex items-center justify-center gap-2 active:scale-95 transition-all w-full
              ${streamActive ? 'bg-red-600 hover:bg-red-500 border-red-500 shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-500 border-blue-500 shadow-blue-500/20'}`}
          >
            {streamActive ? '■ Halt Stream' : '▶ Launch Stream'}
          </button>
          
          <div className="flex bg-gray-900/90 backdrop-blur border border-gray-800 p-3 rounded-lg gap-3 items-center shadow-2xl mt-1">
            <select onChange={e => loadTopology(e.target.value)} defaultValue="" className="bg-gray-800 rounded px-2 py-1.5 text-gray-300 border border-gray-700 w-36 outline-none text-xs font-semibold cursor-pointer hover:bg-gray-700">
               <option value="" disabled>Load Topology...</option>
               {predefinedTopologies.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <select value={routingAlgorithm} onChange={e => setRoutingAlgorithm(e.target.value as any)} className="bg-gray-800 rounded px-2 py-1.5 text-blue-400 border border-blue-500/30 w-42 outline-none text-xs font-semibold cursor-pointer hover:bg-gray-700">
               <option value="dijkstra">Dijkstra Routing</option>
               <option value="bfs">BFS (Hops Only)</option>
               <option value="ospf">Mock OSPF (Latency)</option>
               <option value="round_robin">Round Robin (Load Balance)</option>
               <option value="random">Random Simulation</option>
            </select>

            <select value={playbackSpeed} onChange={e => setPlaybackSpeed(Number(e.target.value))} className="bg-gray-800 rounded px-2 py-1.5 text-yellow-400 border border-yellow-500/30 w-24 outline-none text-xs font-semibold cursor-pointer hover:bg-gray-700">
               <option value={0.5}>0.5x Speed</option>
               <option value={1}>1.0x Speed</option>
               <option value={2}>2.0x Speed</option>
               <option value={4}>4.0x Speed</option>
            </select>
          </div>
          
          {/* Chaos Engine Incident Triggers */}
          <div className="flex bg-gray-900/90 backdrop-blur border border-gray-800 p-3 rounded-lg gap-3 items-center shadow-2xl mt-1">
             <span className="text-xs text-gray-500 font-bold uppercase w-20">Chaos Engine</span>
             <button onClick={() => triggerScenario('normal')} className="text-xs bg-gray-800 hover:bg-emerald-900 border border-gray-700 hover:border-emerald-500 text-gray-300 px-3 py-1.5 rounded transition">Restore Base</button>
             <button onClick={() => triggerScenario('high_congestion')} className="text-xs bg-gray-800 hover:bg-yellow-900 border border-gray-700 hover:border-yellow-500 text-gray-300 px-3 py-1.5 rounded transition">Congest</button>
             <button onClick={() => triggerScenario('router_failure')} className="text-xs bg-gray-800 hover:bg-orange-900 border border-gray-700 hover:border-orange-500 text-gray-300 px-3 py-1.5 rounded transition">Kill Node</button>
             
             <div className="w-[1px] h-6 bg-gray-700 mx-1"></div>
             
             <button onClick={startAutoDemo} className="text-xs bg-blue-900/40 hover:bg-blue-600 border border-blue-500 text-blue-100 font-bold px-4 py-1.5 rounded shadow-[0_0_10px_rgba(59,130,246,0.5)] transition animate-pulse">Auto Demo Mode</button>
          </div>
        </Panel>
        
        {/* EXPLAINABILITY LAYER: Algorithm Route Comparison HUD */}
        {streamActive && selectedSourceId && selectedTargetId && (
          <Panel position="bottom-left" className="bg-gray-900/95 backdrop-blur-md p-4 rounded-xl border border-gray-800 shadow-2xl w-80 mb-4 ml-4">
            <div className="text-xs text-emerald-400 uppercase tracking-widest mb-3 font-semibold pb-2 border-b border-gray-800 flex items-center justify-between">
              <span>Route Analysis Engine</span>
              <span className="animate-pulse">● Recalculating...</span>
            </div>
            
            {(() => {
               const computeMet = (algo: any) => {
                 const p = runRoutingAlgorithm(algo, nodes, edges, selectedSourceId, selectedTargetId);
                 if (!p) return { hops: 0, lat: 'Timeout' };
                 let lat = 0;
                 for(let i=0; i<p.length-1; i++) {
                    const { edge } = getEdgeBetween(edges, p[i], p[i+1]);
                    lat += (edge?.data?.latency as number) || 10;
                 }
                 return { hops: p.length - 1, lat: `${lat}ms` };
               };
               
               const d = computeMet('dijkstra');
               const b = computeMet('bfs');
               const o = computeMet('ospf');
               
               return (
                 <div className="flex flex-col gap-3 text-sm font-mono">
                   <div className={`flex justify-between items-center p-2 rounded transition-colors ${routingAlgorithm === 'dijkstra' ? 'bg-blue-900/40 border border-blue-500/50' : ''}`}>
                     <span className={routingAlgorithm === 'dijkstra' ? 'text-blue-300 font-bold' : 'text-gray-400'}>Dijkstra (Shortest Path)</span>
                     <span className="text-gray-300 text-xs">{d.hops} Hops | {d.lat}</span>
                   </div>
                   <div className={`flex justify-between items-center p-2 rounded transition-colors ${routingAlgorithm === 'bfs' ? 'bg-blue-900/40 border border-blue-500/50' : ''}`}>
                     <span className={routingAlgorithm === 'bfs' ? 'text-blue-300 font-bold' : 'text-gray-400'}>BFS (Hop Logic)</span>
                     <span className="text-gray-300 text-xs">{b.hops} Hops | {b.lat}</span>
                   </div>
                   <div className={`flex justify-between items-center p-2 rounded transition-colors ${routingAlgorithm === 'ospf' ? 'bg-blue-900/40 border border-blue-500/50' : ''}`}>
                     <span className={routingAlgorithm === 'ospf' ? 'text-blue-300 font-bold' : 'text-gray-400'}>OSPF (Cost Metric)</span>
                     <span className="text-gray-300 text-xs">{o.hops} Hops | {o.lat}</span>
                   </div>
                 </div>
               );
            })()}
          </Panel>
        )}

        {inspectedNode && (
          <Panel position="bottom-right" className="bg-gray-900/90 backdrop-blur-md text-gray-300 p-4 rounded-xl border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)] w-64 mb-4 mr-4">
             <div className="flex justify-between items-center border-b border-gray-800 mb-3 pb-2">
                <div className="font-bold text-blue-400">{String(inspectedNode.data?.label)}</div>
                <button onClick={() => setInspectedNodeId(null)} className="text-gray-500 hover:text-white">✕</button>
             </div>
             <div className="flex flex-col gap-4 text-sm mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Hardware Status</span>
                  <select 
                    value={String(inspectedNode.data?.status || 'online')} 
                    onChange={e => updateNodeData(inspectedNode.id, { status: e.target.value })}
                    className="bg-gray-800 text-white rounded px-2 py-1 outline-none text-xs border border-gray-700"
                  >
                    <option value="online">🟢 Online</option>
                    <option value="congested">🟡 Congested</option>
                    <option value="offline">🔴 Offline</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Forced Drop Rate</span>
                    <span className="text-red-400 font-bold">{Math.round((Number(inspectedNode.data?.dropRate) || 0) * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.1" 
                    value={Number(inspectedNode.data?.dropRate) || 0}
                    onChange={e => updateNodeData(inspectedNode.id, { dropRate: parseFloat(e.target.value) })}
                    className="w-full accent-red-500"
                  />
                </div>
             </div>
          </Panel>
        )}

        {/* Global Dashboard */}
        <Panel position="top-right" className="bg-gray-900/90 backdrop-blur-md text-gray-300 p-4 rounded-xl border border-gray-800 text-sm font-mono shadow-2xl w-64 mt-4 mr-4 pointer-events-none">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold pb-2 border-b border-gray-800">Live Telemetry</div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center group">
              <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Throughput</span>
              <span className="text-white font-bold">{throughput} pkt/s</span>
            </div>
            <div className="flex justify-between items-center group">
              <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Packet Loss</span>
              <span className={`font-bold transition-colors ${packetLoss > 0 ? "text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" : "text-emerald-400"}`}>
                {packetLoss}%
              </span>
            </div>
            <div className="flex justify-between items-center group">
              <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Avg Latency</span>
              <span className="text-yellow-400 font-bold drop-shadow-[0_0_5px_rgba(250,204,21,0.2)]">
                {Math.round(metrics.avgLatency)} ms
              </span>
            </div>
          </div>
          
          {/* EVENT LOG LAYER */}
          {events.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-800 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
               <div className="text-[10px] text-gray-600 font-bold uppercase mb-2">System Event Log</div>
               <div className="flex flex-col gap-2">
                 {events.map(ev => {
                   let badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                   if (ev.type === 'error') badgeColor = 'bg-red-500/20 text-red-300 border-red-500/30';
                   if (ev.type === 'warning') badgeColor = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
                   if (ev.type === 'success') badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                   
                   return (
                     <div key={ev.id} className={`text-[10px] p-2 rounded border leading-relaxed shadow-sm ${badgeColor}`}>
                       <div className="opacity-50 text-[8px] mb-1">
                         {new Date(ev.timestamp).toLocaleTimeString()}
                       </div>
                       {ev.message}
                     </div>
                   );
                 })}
               </div>
            </div>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function NetworkCanvas() {
  return (
    <ReactFlowProvider>
      <DnDFlow />
    </ReactFlowProvider>
  );
}
