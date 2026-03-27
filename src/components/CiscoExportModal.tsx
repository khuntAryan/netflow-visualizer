
"use client";

import React, { useState } from 'react';
import { X, Download, Terminal, Settings, BookOpen, Copy, Check, Sparkles, Zap, Network, ShieldCheck, Activity, Database, Globe, AlertTriangle, ShieldAlert, Cpu } from 'lucide-react';
import { CiscoExportData, RoutingType } from '@/utils/ciscoExport';

interface CiscoExportModalProps {
  data: CiscoExportData;
  onClose: () => void;
  routingType: RoutingType;
  setRoutingType: (type: RoutingType) => void;
}

export default function CiscoExportModal({ data, onClose, routingType, setRoutingType }: CiscoExportModalProps) {
  const [activeTab, setActiveTab] = useState<'configs' | 'devices' | 'guide'>('configs');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadFullConfig = () => {
    const fullConfig = {
      ...data,
      timestamp: new Date().toISOString(),
      version: "3.0 (Fault-Tolerant)"
    };
    const blob = new Blob([JSON.stringify(fullConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fault-tolerant-topology-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-6xl max-h-[98vh] shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/5">
        
        {/* Dynamic Header & Intelligence Bar */}
        <div className="p-6 border-b border-white/10 bg-gray-950/90 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-5 relative">
            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 ring-1 ring-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.15)] group">
              <ShieldCheck size={32} className="group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                 <h2 className="text-2xl font-black text-white tracking-tighter">Enterprise R3 v3</h2>
                 <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                   data.health.redundancy === 'Good' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                   data.health.redundancy === 'Weak' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                   'bg-red-500/20 text-red-400 border border-red-500/30'
                 }`}>
                   {data.health.redundancy} Redundancy
                 </span>
              </div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                 Auto-Validated Deployment Configs <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5 order-last lg:order-none">
             {(['OSPF', 'RIP', 'STATIC'] as RoutingType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setRoutingType(type)}
                  className={`px-5 py-2 rounded-xl text-[11px] font-black tracking-widest transition-all ${
                    routingType === type 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {type}
                </button>
             ))}
          </div>

          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-all ml-auto">
             <X size={24} />
          </button>
        </div>

        <div className="flex flex-grow overflow-hidden">
          {/* Intelligence Sidebar */}
          <div className="w-80 bg-gray-950/50 border-r border-white/5 p-6 flex flex-col gap-8 overflow-y-auto hidden xl:flex">
             {/* Health Score */}
             <div className="space-y-4">
                <h3 className="text-[10px] text-gray-600 font-black uppercase tracking-widest flex items-center gap-2">
                  <Activity size={12} /> Real-Time Health Analysis
                </h3>
                <div className="grid grid-cols-1 gap-3">
                   <div className="p-4 bg-gray-900 rounded-2xl border border-white/5 flex flex-col gap-1">
                      <span className="text-[9px] text-gray-500 uppercase font-black">Estimated Latency</span>
                      <span className="text-xl font-black text-white">{data.health.estimatedLatency}</span>
                   </div>
                   <div className="p-4 bg-gray-900 rounded-2xl border border-white/5 flex flex-col gap-1">
                      <span className="text-[9px] text-gray-500 uppercase font-black">Active VLAN Scopes</span>
                      <span className="text-xl font-black text-white">{data.health.vlanCount} Pools</span>
                   </div>
                </div>
             </div>

             {/* Risk Points */}
             <div className="space-y-4">
                <h3 className="text-[10px] text-gray-600 font-black uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle size={12} /> Critical Risk Vectors
                </h3>
                {data.health.riskPoints.length > 0 ? (
                  <div className="space-y-2">
                    {data.health.riskPoints.map((point, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-red-100 text-[11px] font-medium leading-tight">
                         <ShieldAlert size={14} className="text-red-500 flex-shrink-0" />
                         {point}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-400 text-[11px] font-bold flex items-center gap-3">
                     <ShieldCheck size={16} /> Fully Redundant Path
                  </div>
                )}
             </div>

             {/* Resource Allocation */}
             <div className="mt-auto p-4 bg-gray-900/80 rounded-2xl border border-white/5 space-y-3">
                <h6 className="text-[9px] text-gray-500 font-black uppercase flex items-center gap-2">
                  <Cpu size={12} /> Allocation Engine
                </h6>
                <div className="space-y-2">
                   <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Total Interfaces</span>
                      <span className="text-white font-mono">{data.devices.reduce((acc, d) => acc + d.interfaces.length, 0)}</span>
                   </div>
                   <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Router Instances</span>
                      <span className="text-white font-mono">{data.summary.totalRouters}</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex-grow flex flex-col overflow-hidden">
            {/* Tabs & Content Area */}
            <div className="flex border-b border-white/5 bg-gray-900/30 px-6 gap-8">
              {[
                { id: 'configs', label: 'CLI Deployment Configs', icon: Terminal },
                { id: 'devices', label: 'Device Inventory', icon: Settings },
                { id: 'guide', label: 'Fault-Tolerant Build Guide', icon: BookOpen },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${
                    activeTab === tab.id ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <tab.icon size={13} />
                  {tab.label}
                  {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] rounded-t" />}
                </button>
              ))}
            </div>

            <div className="flex-grow overflow-y-auto p-8 bg-black/60 custom-scrollbar">
              {activeTab === 'configs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.devices.map(dev => (
                    <div key={dev.id} className="bg-gray-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all hover:border-emerald-500/20 group">
                      <div className="px-5 py-4 bg-gray-900 border-b border-white/10 flex justify-between items-center group-hover:bg-gray-800/80 transition-colors">
                        <div className="flex items-center gap-3">
                           <span className={`w-2 h-2 rounded-full ${dev.type === 'router' ? 'bg-orange-500' : dev.type === 'switch' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                           <span className="text-sm font-black text-white uppercase tracking-wider">{dev.name}</span>
                           <span className="text-[9px] font-black text-gray-500 bg-black/50 px-2 py-0.5 rounded uppercase tracking-widest">{dev.role}</span>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(dev.config, dev.id)}
                          className="p-2.5 hover:bg-emerald-500/10 rounded-xl text-gray-500 hover:text-emerald-400 transition-all active:scale-90"
                        >
                          {copiedId === dev.id ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                      </div>
                      <pre className="p-6 text-[11px] font-mono text-gray-400 leading-relaxed max-h-[400px] overflow-y-auto bg-black/40 selection:bg-emerald-500/20">
                        {dev.config}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'devices' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {data.devices.map(dev => (
                    <div key={dev.id} className="bg-gray-900/40 border border-white/10 p-6 rounded-3xl space-y-5 hover:bg-gray-900/80 transition-all border-l-2 border-l-emerald-500/30">
                      <div className="flex justify-between items-start">
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{dev.type}</span>
                            <h4 className="text-lg font-black text-white tracking-tight">{dev.name}</h4>
                         </div>
                         <div className="p-2 bg-black/40 rounded-xl"><Globe size={16} className="text-gray-500" /></div>
                      </div>
                      <div className="space-y-3">
                        {dev.interfaces.map((int, i) => (
                          <div key={i} className="flex flex-col gap-2 p-3 bg-black/30 rounded-2xl border border-white/5 group">
                            <div className="flex justify-between items-center">
                               <span className="text-[10px] font-black text-gray-500 uppercase">{int.name}</span>
                               {int.ospfCost && <span className="text-[9px] text-orange-400 font-bold">Cost {int.ospfCost}</span>}
                            </div>
                            <span className="text-xs font-mono text-emerald-200">{int.ipAddress || (int.vlan ? `VLAN ${int.vlan}` : 'L2 Link')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'guide' && (
                <div className="max-w-3xl mx-auto py-10">
                   <div className="bg-gray-950/80 border border-emerald-500/20 rounded-[2.5rem] p-12 shadow-3xl relative overflow-hidden backdrop-blur-3xl group">
                      <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-1000" />
                      
                      <h1 className="text-3xl font-black text-white mb-8 tracking-tighter flex items-center gap-4">
                        <BookOpen size={32} className="text-emerald-500" /> Infrastructure Playbook
                      </h1>
                      
                      <div className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed text-sm space-y-6 prose prose-invert max-w-none">
                        {data.guide}
                      </div>

                      <div className="mt-12 bg-black/40 border border-white/5 rounded-3xl p-8 flex items-start gap-6">
                         <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400"><Activity size={24} /></div>
                         <div>
                            <h5 className="text-white font-bold mb-2">Architect's Note on Resilience</h5>
                            <p className="text-xs text-gray-500 m-0 leading-relaxed">
                              This configuration was algorithmically generated to prioritize path diversity and minimal hop-count risk. For mission-critical endpoints, ensure that at least two routing adjacencies are formed in the OSPF neighbor table before deploying production traffic.
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-8 border-t border-white/10 bg-gray-950/90 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-10">
              <div className="flex flex-col gap-1">
                 <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Network Rating</span>
                 <div className="flex items-center gap-1 text-emerald-500">
                    {[1, 2, 3, 4, 5].map(i => <ShieldCheck key={i} size={14} fill={i <= (data.health.redundancy === 'Good' ? 5 : 3) ? "currentColor" : "none"} />)}
                 </div>
              </div>
              <div className="hidden lg:flex flex-col gap-1">
                 <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Allocation Strategy</span>
                 <span className="text-xs text-white font-bold">Dynamic OSPF Cost Hierarchies</span>
              </div>
           </div>

           <button 
             onClick={downloadFullConfig}
             className="w-full md:w-auto flex items-center justify-center gap-4 bg-gradient-to-r from-emerald-600 to-indigo-700 hover:from-emerald-500 hover:to-indigo-600 text-white font-black py-4 px-12 rounded-2xl shadow-2xl shadow-emerald-500/20 transition-all active:scale-95 text-[11px] uppercase tracking-[0.3em] group"
           >
             <Download size={18} className="group-hover:translate-y-0.5 transition-transform" /> 
             Download Full R3 Enterprise Bundle
           </button>
        </div>
      </div>
    </div>
  );
}
