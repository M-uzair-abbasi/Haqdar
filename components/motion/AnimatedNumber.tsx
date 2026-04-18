"use client";
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export default function AnimatedNumber({
  to,
  prefix = "",
  suffix = "",
  durationMs = 1800,
  className = "",
  decimals = 0,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [v, setV] = useState(0);
  const startRef = useRef<number | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!inView) return;
    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min(1, (ts - startRef.current) / durationMs);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [inView, to, durationMs]);

  const display = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-PK");
  return <span ref={ref} className={`count-up ${className}`}>{prefix}{display}{suffix}</span>;
}
