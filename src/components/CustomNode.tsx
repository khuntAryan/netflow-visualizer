"use client";

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Laptop, Router, Server, Smartphone, Wifi, Radio, Globe } from 'lucide-react';
import useStore from '@/store/useStore';
import { useShallow } from 'zustand/react/shallow';

export function GroupNode({ data, style }: { data: any, style: any }) {
  return (
    <div 
      className="relative w-full h-full rounded-[40px] border-2 border-dashed flex items-start justify-center p-6 transition-all duration-700 overflow-visible"
      style={{ 
        borderColor: `${data.color}44`,
        backgroundColor: `${data.color}11`,
        boxShadow: `0 0 40px ${data.color}11, inset 0 0 20px ${data.color}05`,
      }}
    >
      <div 
        className="absolute -top-4 left-10 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md shadow-xl"
        style={{ 
          backgroundColor: `${data.color}22`, 
          borderColor: `${data.color}66`,
          color: data.color 
        }}
      >
        {data.label}
      </div>
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-[40px] opacity-30" style={{ borderColor: data.color }}></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-[40px] opacity-30" style={{ borderColor: data.color }}></div>
    </div>
  );
}

export default function NodeRenderer(props: any) {
  if (props.type === 'groupNode') return <GroupNode {...props} />;
  return <CustomNode {...props} />;
}

function CustomNode({ id, data, type }: { id: string, data: any, type: string }) {
  const isOffline = data?.status === 'offline';
  const isCongested = data?.status === 'congested';
  const label = data?.label || 'Node';
  const dropRate = Number(data?.dropRate) || 0;
  const nodeType = data?.nodeType || type; // prefer data.nodeType

  const getIcon = () => {
    const l = label.toLowerCase();
    const t = nodeType?.toLowerCase() || '';
    if (l.includes('pc') || l.includes('client') || t.includes('pc')) return <Laptop size={18} />;
    if (l.includes('server') || t.includes('server')) return <Server size={18} />;
    if (l.includes('mobile') || l.includes('phone') || t.includes('mobile')) return <Smartphone size={18} />;
    if (l.includes('wifi') || l.includes('access point') || t.includes('wifi') || t.includes('access_point')) return <Wifi size={18} />;
    if (l.includes('internet') || t.includes('internet')) return <Globe size={18} />;
    if (l.includes('router') || t.includes('router')) return <Router size={18} />;
    return <Radio size={18} />;
  };
   
  // Dynamic Load Visualization (Heatmap computation)
  const trafficCount = useStore(useShallow(state => 
    state.packets.filter(p => p.status === 'in-transit' && (p.targetId === id || p.currentEdgeId.includes(id) || p.path.includes(id))).length
  ));

  const loadPercent = Math.min(100, trafficCount * 12); // Extrapolate load visually

  let ringClass = "ring-gray-700 ring-2";
  let bgClass = "bg-gray-800/90";
  let textClass = "text-gray-200";

  // Auto-Tutor Highlighting Logic
  const isNodeInStep = useStore(state => state.isNodeInCurrentStep(id));
  const isTutoring = useStore(state => state.currentStepIndex !== -1);

  if (isOffline) {
    ringClass = "ring-red-500/50 ring-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]";
    bgClass = "bg-red-950/80";
    textClass = "text-red-400";
  } else if (isCongested) {
    ringClass = "ring-yellow-500 border-yellow-500 ring-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)] animate-pulse shadow-inner";
    bgClass = "bg-yellow-900/60";
    textClass = "text-yellow-300 font-bold";
  } else if (loadPercent > 50) {
    ringClass = "ring-emerald-400 ring-2 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]"; 
    bgClass = "bg-emerald-900/30";
    textClass = "text-emerald-50";
  } else if (loadPercent > 0) {
    ringClass = "ring-blue-500/80 ring-2 drop-shadow-[0_0_5px_rgba(59,130,246,0.3)]"; 
    bgClass = "bg-blue-900/20";
  }

  const dimmingClass = isTutoring && !isNodeInStep ? "opacity-20 blur-[1px] scale-90" : "opacity-100 scale-100";
  const highlightingClass = isTutoring && isNodeInStep ? "ring-offset-4 ring-offset-black ring-emerald-400 ring-2 z-50 duration-700" : "";

  return (
    <div className={`relative px-5 py-3 rounded-lg shadow-2xl outline-none backdrop-blur-md transition-all duration-700 cursor-pointer min-w-[120px] ${bgClass} ${ringClass} ${dimmingClass} ${highlightingClass}`}>
      {/* Universal Handles for Dynamic Graphing */}
      <Handle type="target" position={Position.Top} id="t" className="opacity-0 w-full h-full absolute inset-0 rounded-lg" />
      <Handle type="source" position={Position.Bottom} id="b" className="opacity-0 w-full h-full absolute inset-0 rounded-lg" />
      <Handle type="source" position={Position.Left} id="l" className="opacity-0" />
      <Handle type="source" position={Position.Right} id="r" className="opacity-0" />
      
      {/* Node Utilization Gauge */}
      {!isOffline && loadPercent > 0 && (
        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-t-lg transition-all duration-300 ease-linear shadow-[0_0_10px_rgba(52,211,153,1)]" style={{ width: `${loadPercent}%` }} />
      )}

      {/* Label & Status */}
      <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
         <div className={`mb-1 transition-colors ${textClass}`}>
           {getIcon()}
         </div>
         <span className={`font-mono font-bold text-[10px] whitespace-nowrap tracking-wide drop-shadow-md transition-colors ${textClass}`}>
           {isOffline ? '✖ ' : isCongested ? '⚠ ' : ''}{label}
         </span>
         
         <div className="flex gap-2 items-center justify-center mt-1">
           {/* Load HUD */}
           {!isOffline && trafficCount > 0 && (
             <span className="text-[9px] text-blue-200 font-mono bg-blue-500/20 border border-blue-500/40 px-2 py-0.5 rounded-full shadow-inner">
               Q: {trafficCount}
             </span>
           )}
           {/* Loss HUD */}
           {dropRate > 0 && (
             <span className="text-[9px] text-red-100 font-bold font-mono bg-red-500/40 border border-red-500/80 px-2 py-0.5 rounded-full shadow-inner">
               L: {Math.round(dropRate * 100)}%
             </span>
           )}
         </div>
      </div>
    </div>
  );
}
