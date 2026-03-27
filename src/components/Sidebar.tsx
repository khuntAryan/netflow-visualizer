"use client";

import { Laptop, Router, Server, Smartphone, Wifi, Radio, Send, Download, Terminal } from 'lucide-react';
import AiAssistant from './AiAssistant';
import useStore from '@/store/useStore';
import { generateIntelligentEnterpriseConfig, CiscoExportData, RoutingType } from '@/utils/ciscoExport';
import CiscoExportModal from './CiscoExportModal';
import { useState } from 'react';

export default function Sidebar() {
  const nodes = useStore(state => state.nodes);
  const edges = useStore(state => state.edges);
  const [exportData, setExportData] = useState<CiscoExportData | null>(null);
  const [routingType, setRoutingType] = useState<RoutingType>('OSPF');

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/nodeLabel', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleCiscoExport = () => {
    const data = generateIntelligentEnterpriseConfig(nodes, edges, routingType);
    setExportData(data);
  };

  return (
    <aside className="w-80 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-4 text-white hidden md:flex border-r-emerald-800/20 overflow-y-auto">
      <div className="text-xl font-bold tracking-tight mb-2 text-emerald-400">NetFlow Builder</div>
      
      <AiAssistant />

      <button
        onClick={handleCiscoExport}
        className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all text-xs uppercase tracking-widest border border-white/5 group"
      >
        <Terminal size={14} className="group-hover:rotate-12 transition-transform" />
        Export to Cisco Tracer
      </button>

      {exportData && (
        <CiscoExportModal 
          data={exportData} 
          onClose={() => setExportData(null)} 
          routingType={routingType}
          setRoutingType={(type) => {
            setRoutingType(type);
            // Re-generate on toggle
            const newData = generateIntelligentEnterpriseConfig(nodes, edges, type);
            setExportData(newData);
          }}
        />
      )}

      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Drag Components</div>
      
      <div className="grid grid-cols-2 gap-2">
        <div 
          className="flex items-center gap-2 p-2 bg-gray-800/50 hover:bg-gray-700/80 rounded-lg border border-gray-700 hover:border-blue-500/50 cursor-grab active:cursor-grabbing transition-all"
          onDragStart={(e) => onDragStart(e, 'pc', 'PC')}
          draggable
        >
          <div className="bg-blue-500/10 p-1.5 rounded-md">
            <Laptop size={16} className="text-blue-400" />
          </div>
          <span className="font-medium text-xs">PC</span>
        </div>

        <div 
          className="flex items-center gap-2 p-2 bg-gray-800/50 hover:bg-gray-700/80 rounded-lg border border-gray-700 hover:border-orange-500/50 cursor-grab active:cursor-grabbing transition-all"
          onDragStart={(e) => onDragStart(e, 'router', 'Router')}
          draggable
        >
          <div className="bg-orange-500/10 p-1.5 rounded-md">
            <Router size={16} className="text-orange-400" />
          </div>
          <span className="font-medium text-xs">Router</span>
        </div>

        <div 
          className="flex items-center gap-2 p-2 bg-gray-800/50 hover:bg-gray-700/80 rounded-lg border border-gray-700 hover:border-purple-500/50 cursor-grab active:cursor-grabbing transition-all"
          onDragStart={(e) => onDragStart(e, 'server', 'Server')}
          draggable
        >
          <div className="bg-purple-500/10 p-1.5 rounded-md">
            <Server size={16} className="text-purple-400" />
          </div>
          <span className="font-medium text-xs">Server</span>
        </div>

        <div 
          className="flex items-center gap-2 p-2 bg-gray-800/50 hover:bg-gray-700/80 rounded-lg border border-gray-700 hover:border-pink-500/50 cursor-grab active:cursor-grabbing transition-all"
          onDragStart={(e) => onDragStart(e, 'mobile', 'Mobile')}
          draggable
        >
          <div className="bg-pink-500/10 p-1.5 rounded-md">
            <Smartphone size={16} className="text-pink-400" />
          </div>
          <span className="font-medium text-xs">Mobile</span>
        </div>

        <div 
          className="flex items-center gap-2 p-2 bg-gray-800/50 hover:bg-gray-700/80 rounded-lg border border-gray-700 hover:border-cyan-500/50 cursor-grab active:cursor-grabbing transition-all"
          onDragStart={(e) => onDragStart(e, 'wifi', 'WiFi Router')}
          draggable
        >
          <div className="bg-cyan-500/10 p-1.5 rounded-md">
            <Wifi size={16} className="text-cyan-400" />
          </div>
          <span className="font-medium text-xs">WiFi</span>
        </div>

        <div 
          className="flex items-center gap-2 p-2 bg-gray-800/50 hover:bg-gray-700/80 rounded-lg border border-gray-700 hover:border-yellow-500/50 cursor-grab active:cursor-grabbing transition-all"
          onDragStart={(e) => onDragStart(e, 'access_point', 'Access Point')}
          draggable
        >
          <div className="bg-yellow-500/10 p-1.5 rounded-md">
            <Radio size={16} className="text-yellow-400" />
          </div>
          <span className="font-medium text-xs">AP</span>
        </div>
      </div>
    </aside>
  );
}
