"use client";
import { useEffect, useRef, useState } from "react";

export default function CountUp({
  to,
  prefix = "",
  suffix = "",
  durationMs = 1600,
  className = "",
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
}) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min(1, (ts - startRef.current) / durationMs);
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [to, durationMs]);

  return (
    <span className={`count-up ${className}`}>
      {prefix}
      {value.toLocaleString("en-PK")}
      {suffix}
    </span>
  );
}
