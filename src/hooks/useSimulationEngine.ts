import { useEffect, useRef } from 'react';
import useStore from '@/store/useStore';

export function useSimulationEngine() {
  const streamActive = useStore((state) => state.streamActive);
  const tick = useStore((state) => state.tick);
  
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!streamActive) {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      previousTimeRef.current = null;
      return;
    }

    const animate = (time: number) => {
      if (previousTimeRef.current !== null) {
        // Calculate raw performance difference between frames.
        // CAPPED at 50ms (resolves "Disappearing packets" critical bug triggered by users tabbing out of the browser during active rendering loops).
        const deltaTime = Math.min(time - previousTimeRef.current, 50);
        tick(deltaTime);
      }
      
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, [streamActive, tick]);
}
