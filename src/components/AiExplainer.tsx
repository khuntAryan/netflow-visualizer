"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, ChevronRight, ChevronLeft, Sparkles, Loader2, Send, Mic, MicOff, RefreshCw, Zap, ShieldAlert, WifiHigh } from 'lucide-react';
import useStore from '@/store/useStore';

export default function AiExplainer() {
  const { 
    nodes, edges, groups, selectedSourceId, selectedTargetId, metrics, routingAlgorithm,
    understandingSteps, currentStepIndex, setCurrentStepIndex, setUnderstanding,
    isUnderstanding, setIsUnderstanding, addEvent, applyTopologyChanges, updateNodeData, restructureTopology
  } = useStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interactionResponse, setInteractionResponse] = useState<{ brief: string, steps?: any[] } | null>(null);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      const SpeechReg = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechReg) {
        recognitionRef.current = new SpeechReg();
        recognitionRef.current.continuous = false;
        recognitionRef.current.onresult = (e: any) => setUserInput(e.results[0][0].transcript);
        recognitionRef.current.onend = () => setIsListening(false);
      }
    }
    return () => synthRef.current?.cancel();
  }, []);

  const playStep = (index: number) => {
    if (!understandingSteps || !synthRef.current) return;
    
    // Stop any existing speech!
    synthRef.current.cancel();

    const step = understandingSteps[index];
    if (!step) return;

    // Correctly update progress
    setCurrentStepIndex(index);
    setIsPaused(false);

    if (isMuted) return;

    // Replay logic: ALWAYS create a new instance
    const utterance = new SpeechSynthesisUtterance(step.text || step.explanation);
    utterance.rate = playbackRate;
    
    utterance.onend = () => {
       // If in standard "Play Mode", automatically advance
       if (isPlaying && index < understandingSteps.length - 1) {
          setTimeout(() => playStep(index + 1), 1200);
       } else if (index === understandingSteps.length - 1) {
          setIsPlaying(false);
       }
    };

    synthRef.current.speak(utterance);
  };

  const handleInteraction = async (explicitInput?: string) => {
    const finalInput = explicitInput || userInput;
    if (!finalInput.trim() || isProcessing) return;
    
    setIsPlaying(false);
    synthRef.current?.cancel();
    setIsProcessing(true);
    setInteractionResponse(null);
    setUserInput('');

    try {
      const response = await fetch('/api/interact-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalInput,
          context: {
            nodes: nodes.filter((n: any) => n.type !== 'groupNode'),
            edges, groups,
            sourceId: selectedSourceId,
            targetId: selectedTargetId,
            algorithm: routingAlgorithm
          }
        })
      });

      const data = await response.json();
      
      if (data.action === 'update_topology' && data.topology) {
        addEvent("AI Core: Re-Architecting Topology...", "info");
        const success = restructureTopology(data.topology);
        if (!success) throw new Error("Proposed topology disconnected the network.");
      }

      setInteractionResponse({ brief: data.briefExplanation, steps: data.steps });
      
      const utterance = new SpeechSynthesisUtterance(data.briefExplanation);
      utterance.rate = playbackRate;
      utterance.onend = () => {
         if (data.steps?.length > 0) {
            setUnderstanding(data.steps);
            setTimeout(() => {
               setIsPlaying(true);
               playStep(0);
            }, 600);
         }
      };
      synthRef.current?.speak(utterance);

    } catch (error: any) {
      addEvent(`Architect Error: ${error.message}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnderstand = async () => {
    if (isUnderstanding) return;
    setIsUnderstanding(true);
    addEvent("Analyzing multi-domain telemetry...", "info");

    try {
      const resp = await fetch('/api/explain-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodes.filter((n: any) => n.type !== 'groupNode'),
          edges, groups,
          sourceId: selectedSourceId, targetId: selectedTargetId,
          metrics, algorithm: routingAlgorithm
        })
      });

      const data = await resp.json();
      setUnderstanding(data.steps);
      setIsPlaying(true);
      setTimeout(() => playStep(0), 100);
    } catch (err: any) {
      addEvent(`AI Error: ${err.message}`, "error");
    } finally {
      setIsUnderstanding(false);
    }
  };

  const togglePause = () => {
    if (isPaused) {
       setIsPaused(false);
       synthRef.current?.resume();
    } else {
       setIsPaused(true);
       synthRef.current?.pause();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  if (!understandingSteps && !isUnderstanding) {
    return (
      <button 
        onClick={handleUnderstand}
        className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95 text-xs uppercase tracking-widest border border-white/10"
      >
        <Sparkles size={14} className="animate-pulse" /> Understand Architecture
      </button>
    );
  }

  const currentStep = understandingSteps?.[currentStepIndex];

  return (
    <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl w-full max-w-sm flex flex-col gap-4 overflow-hidden relative group">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
           <div className="p-1.5 bg-emerald-500/10 rounded-lg">
             <Sparkles size={16} className="text-emerald-400" />
           </div>
           <h3 className="text-white font-bold text-xs uppercase tracking-wider">AI Interactive Tutor</h3>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setIsMuted(!isMuted)} className="p-1.5 hover:bg-white/5 rounded-md text-gray-400">
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
           </button>
           <button onClick={() => { setUnderstanding(null); setIsPlaying(false); setInteractionResponse(null); synthRef.current?.cancel(); }} className="p-1.5 hover:bg-white/5 rounded-md text-gray-400">
              <RotateCcw size={14} />
           </button>
        </div>
      </div>

      <div className="min-h-[70px] flex flex-col justify-center">
        {isUnderstanding || isProcessing ? (
           <div className="flex flex-col items-center gap-3 animate-pulse py-4">
              <RefreshCw size={24} className="animate-spin text-emerald-500" />
              <p className="text-[11px] text-emerald-400 font-mono italic">
                {isProcessing ? "Re-Architecting Scaling Layers..." : "Synthesizing Neural Graph..."}
              </p>
           </div>
        ) : interactionResponse ? (
           <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
             <p className="text-[12px] text-indigo-200 italic leading-relaxed">"{interactionResponse.brief}"</p>
             <button onClick={() => setInteractionResponse(null)} className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-bold mt-3 uppercase tracking-wide group">
                <RotateCcw size={10} className="group-hover:rotate-180 transition-transform" /> Back to Tutor
             </button>
           </div>
        ) : currentStep && (
           <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-2">
             <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-500 text-black font-black px-1.5 rounded">STEP {currentStepIndex + 1}</span>
                <span className="text-[11px] text-gray-300 font-bold tracking-tight">{ currentStep.title || "Network Flow" }</span>
             </div>
             <p className="text-[12px] text-white/90 leading-snug">
                "{currentStep.text || currentStep.explanation}"
             </p>
           </div>
        )}
      </div>

      {/* STEP NAVIGATION LIST */}
      {!isUnderstanding && !isProcessing && understandingSteps && !interactionResponse && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {understandingSteps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setIsPlaying(false); playStep(idx); }}
              className={`flex-shrink-0 w-8 h-8 rounded-lg text-[10px] font-bold transition-all border ${
                idx === currentStepIndex 
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20 scale-110' 
                  : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 pt-3 border-t border-white/5">
        <div className="relative flex items-center gap-2">
          <button 
            onClick={toggleListening}
            className={`p-2 rounded-xl border transition-all ${isListening ? 'bg-red-500 border-red-400 text-white animate-pulse' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
          >
            {isListening ? <Mic size={14} /> : <MicOff size={14} />}
          </button>
          <input 
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInteraction()}
            placeholder="Scale, Modify, or Ask Anything..."
            className="flex-grow bg-black/40 border border-white/10 px-4 py-2 rounded-xl text-[11px] text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-gray-600"
          />
          <button onClick={() => handleInteraction()} className="absolute right-1.5 p-1.5 text-emerald-500 hover:text-emerald-400">
             <Send size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1">
              <button 
                disabled={!understandingSteps || currentStepIndex === 0} 
                onClick={() => { setIsPlaying(false); playStep(currentStepIndex - 1); }} 
                className="p-1.5 disabled:opacity-20 hover:bg-white/5 rounded-md text-white transition-all transform active:scale-90"
              >
                <ChevronLeft size={20} />
              </button>
              
              <button onClick={togglePause} className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl shadow-lg shadow-emerald-500/20 active:scale-90 transition-all">
                 {isPaused ? <Play size={22} fill="currentColor" /> : <Pause size={22} fill="currentColor" />}
              </button>
              
              <button 
                disabled={!understandingSteps || currentStepIndex === understandingSteps.length - 1} 
                onClick={() => { setIsPlaying(false); playStep(currentStepIndex + 1); }} 
                className="p-1.5 disabled:opacity-20 hover:bg-white/5 rounded-md text-white transition-all transform active:scale-90"
              >
                <ChevronRight size={20} />
              </button>
           </div>
           
           <div className="flex-grow h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-700 ease-out"
                style={{ width: understandingSteps ? `${((currentStepIndex + 1) / understandingSteps.length) * 100}%` : '0%' }}
              />
           </div>
        </div>
      </div>
    </div>
  );
}
