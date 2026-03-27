"use client";

import React, { useRef, useEffect, useState } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import useStore from '@/store/useStore';

export default function CustomEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data } = props;
  const isGlowing = data?.isGlowing;

  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition
  });

  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [edgePath]);

  const packets = useStore(useShallow(state => 
    state.packets.filter(p => p.currentEdgeId === id && (p.status === 'in-transit' || p.status === 'dropped'))
  ));

  const isActiveTraffic = packets.length > 0;
  const isHighTraffic = packets.length > 3;

  const isWireless = data?.edgeType === 'wireless';
  const signalStrength = Number(data?.signalStrength ?? 1.0);

  const isDimmed = data?.isDimmed;

  // AI Tutor Highlighting
  const isTutoring = useStore(state => state.currentStepIndex !== -1);
  const isSourceInStep = useStore(state => state.isNodeInCurrentStep(props.source));
  const isTargetInStep = useStore(state => state.isNodeInCurrentStep(props.target));
  const isEdgeInStep = isSourceInStep || isTargetInStep;

  let edgeClass = "transition-all duration-700 z-0";
  if (isTutoring && !isEdgeInStep) {
    edgeClass += " opacity-10 stroke-gray-800 stroke-[1px] blur-[1px]";
  } else if (isWireless) {
    edgeClass += " stroke-blue-400/30 stroke-[2px] stroke-dasharray-5";
  } else {
    edgeClass += " stroke-gray-700/40 stroke-[1.5px]";
  }

  if (isGlowing && (!isTutoring || isEdgeInStep)) {
    edgeClass = isWireless 
      ? "stroke-blue-400 stroke-[3px] stroke-dasharray-5 filter drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-700 relative z-10"
      : "stroke-emerald-400 stroke-[3px] filter drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-all duration-700 relative z-10";
  } else if (isDimmed && !isTutoring) {
    edgeClass = "stroke-emerald-500/20 stroke-[1.5px] stroke-dasharray-2 transition-all duration-300 z-0";
  } else if (isHighTraffic && (!isTutoring || isEdgeInStep)) {
    edgeClass = "stroke-orange-500/60 stroke-[2.5px] filter drop-shadow-[0_0_5px_rgba(249,115,22,0.5)] transition-all duration-300 relative z-10";
  } else if (isActiveTraffic && (!isTutoring || isEdgeInStep)) {
    edgeClass = isWireless
      ? "stroke-blue-500/50 stroke-[2.5px] stroke-dasharray-5 transition-all duration-300 relative z-10"
      : "stroke-blue-500/50 stroke-[2px] filter drop-shadow-[0_0_4px_rgba(59,130,246,0.3)] transition-all duration-300 relative z-10";
  }

  return (
    <>
      <path ref={pathRef} d={edgePath} fill="none" stroke="none" />
      
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ 
          ...style, 
          strokeDasharray: isWireless ? '5,5' : 'none',
          animation: isWireless ? 'dash-animation 30s linear infinite' : 'none'
        }} 
        className={edgeClass} 
      />

      <style>{`
        @keyframes dash-animation {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
      
      {packets.map(packet => {
        const p = packet.isReversed ? (1 - packet.progress) : packet.progress;
        
        let cx = sourceX;
        let cy = sourceY;
        
        if (pathRef.current && pathLength > 0) {
          const pt = pathRef.current.getPointAtLength(p * pathLength);
          cx = pt.x;
          cy = pt.y;

          if (isWireless) {
            // Add wireless fluctuation/jitter
            const frequency = 20;
            const amplitude = 8 * (1 - signalStrength + 0.2); 
            const jitterX = Math.sin(p * frequency + packet.id.length) * amplitude;
            const jitterY = Math.cos(p * frequency + packet.id.length) * amplitude;
            cx += jitterX;
            cy += jitterY;
          }
        }

        // Determine particle rendering physics based on status layout maps dynamically
        const isDropped = packet.status === 'dropped';
        
        let colorClass = isWireless ? 'fill-blue-400 opacity-100' : 'fill-emerald-400 opacity-100';
        let dropShadow = isWireless ? 'drop-shadow(0 0 10px rgba(96, 165, 250, 0.9))' : 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.9))';
        
        if (isDropped) {
           colorClass = 'fill-red-500 scale-150 opacity-0';
           dropShadow = 'drop-shadow(0 0 25px rgba(239, 68, 68, 1))';
        } else if ((packet as any).packetType === 'video') {
           colorClass = 'fill-purple-400 opacity-100';
           dropShadow = 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.9))';
        } else if ((packet as any).packetType === 'api') {
           colorClass = 'fill-blue-400 opacity-100';
           dropShadow = 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.9))';
        }

        // Fluctuate size for wireless packets
        const randomSeed = parseFloat(packet.id.split('_')[2]) || 0;
        const radius = isWireless 
          ? (isHighTraffic ? 3 : 5) + Math.sin(Date.now() / 100 + randomSeed) * 1.5
          : (isHighTraffic ? 4 : 6);
        
        return (
          <circle
            key={packet.id}
            r={radius}
            cx={cx}
            cy={cy}
            className={`transition-all duration-300 ${colorClass}`}
            style={{ filter: dropShadow, transformOrigin: `${cx}px ${cy}px` }}
          />
        );
      })}
    </>
  );
}
