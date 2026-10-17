"use client";

import { useEffect, useRef, useState } from "react";

export const STEP_DURATIONS = [2500, 3000, 3000, 3000, 2500] as const;
export const CONNECTOR_DURATION = 300;
export const SEGMENT_DURATIONS = STEP_DURATIONS.flatMap((duration, index) => index < 4 ? [duration, CONNECTOR_DURATION] : [duration]);
export const JOURNEY_DURATION = SEGMENT_DURATIONS.reduce((total, duration) => total + duration, 0);

export function useJourneyClock(allowed: boolean) {
  const [state, setState] = useState({ segment: 0, revision: 0, finished: false });
  const remainingRef = useRef<number>(SEGMENT_DURATIONS[0]);
  const epochRef = useRef(0);
  const running = allowed && !state.finished;

  useEffect(() => {
    if (!running) return;
    const epoch = epochRef.current;
    let previous = window.performance.now();
    let frame = 0;
    let crossed = false;

    function tick(now: number) {
      if (epoch !== epochRef.current) return;
      remainingRef.current -= now - previous;
      previous = now;
      if (remainingRef.current <= 0) {
        crossed = true;
        const next = state.segment + 1;
        if (next >= SEGMENT_DURATIONS.length) {
          remainingRef.current = 0;
          setState((value) => ({ ...value, finished: true }));
        } else {
          const overrun = -remainingRef.current;
          remainingRef.current = Math.max(0, SEGMENT_DURATIONS[next] - overrun);
          setState((value) => ({ ...value, segment: next }));
        }
        return;
      }
      frame = window.requestAnimationFrame(tick);
    }

    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      if (!crossed && epoch === epochRef.current) {
        remainingRef.current = Math.max(0, remainingRef.current - (window.performance.now() - previous));
      }
    };
  }, [running, state.segment, state.revision]);

  function goToStep(index: number) {
    const safeIndex = Math.max(0, Math.min(4, index));
    epochRef.current += 1;
    remainingRef.current = STEP_DURATIONS[safeIndex];
    setState((value) => ({ segment: safeIndex * 2, revision: value.revision + 1, finished: false }));
  }

  return {
    ...state,
    activeStep: Math.min(4, Math.floor(state.segment / 2)),
    transitioning: state.segment % 2 === 1,
    running,
    goToStep,
  };
}
