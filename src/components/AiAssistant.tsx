"use client";

import React, { useState } from 'react';
import { Sparkles, Send, Loader2, RotateCcw } from 'lucide-react';
import useStore from '@/store/useStore';
import { Node, Edge } from '@xyflow/react';

export default function AiAssistant() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const applyAiTopology = useStore(state => state.applyAiTopology);
  const aiExplanation = useStore(state => state.aiExplanation);
  const nodes = useStore(state => state.nodes);
  const edges = useStore(state => state.edges);

  const handleGenerate = async (isRefinement = false) => {
    if (!prompt.trim()) return;
    setLoading(true);

    try {
      const response = await fetch('/api/generate-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: isRefinement ? { nodes, edges } : undefined
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate network');
      }

      const result = await response.json();
      applyAiTopology(result);
      setPrompt('');
    } catch (error: any) {
       console.error("AI Generation failed", error);
       const addEvent = useStore.getState().addEvent;
       addEvent(`AI Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-900/50 border border-emerald-500/20 rounded-xl mt-4">
      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
        <Sparkles size={16} />
        <span>Ask AI Network Gen</span>
      </div>
      
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={aiExplanation ? "Refine (e.g. 'Add redundancy')" : "e.g. 'Show mobile connecting to server via WiFi'"}
          className="w-full bg-gray-800/80 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleGenerate(!!aiExplanation);
            }
          }}
        />
        <button
          onClick={() => handleGenerate(!!aiExplanation)}
          disabled={loading || !prompt.trim()}
          className="absolute bottom-3 right-3 p-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-gray-700 rounded-md transition-all"
        >
          {loading ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} className="text-white" />}
        </button>
      </div>

      {aiExplanation && !loading && (
        <div className="bg-emerald-950/30 border border-emerald-500/10 p-3 rounded-lg">
           <div className="text-[10px] text-emerald-500 font-bold uppercase mb-1 flex justify-between items-center">
             <span>AI Analysis</span>
             <button onClick={() => setPrompt('')} className="text-gray-500 hover:text-white"><RotateCcw size={10} /></button>
           </div>
           <p className="text-xs text-gray-400 leading-relaxed italic">
             "{aiExplanation}"
           </p>
        </div>
      )}
    </div>
  );
}

// Implementation of the AI assistant UI is complete. 
// Generation logic has been moved to the server-side API.
