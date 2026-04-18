"use client";
import { useRef, MouseEvent, ReactNode } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export default function TiltCard({
  children,
  className = "",
  intensity = 10,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useSpring(0, { stiffness: 150, damping: 15 });
  const my = useSpring(0, { stiffness: 150, damping: 15 });
  const rotX = useTransform(my, [-1, 1], [intensity, -intensity]);
  const rotY = useTransform(mx, [-1, 1], [-intensity, intensity]);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    mx.set(px * 2 - 1);
    my.set(py * 2 - 1);
  }
  function onLeave() { mx.set(0); my.set(0); }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
