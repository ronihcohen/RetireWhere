"use client";
import { useState, useEffect, useRef } from "react";

export function useCountUp(target: number, duration = 750): number {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;

    if (from === target) return;

    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(target);
      }
    }

    if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}
