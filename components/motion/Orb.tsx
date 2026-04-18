"use client";
import { motion } from "framer-motion";

export default function Orb({
  className = "",
  color = "rgba(212,175,55,0.45)",
  size = 420,
  delay = 0,
}: {
  className?: string;
  color?: string;
  size?: number;
  delay?: number;
}) {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay }}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${color}, transparent 70%)`,
        filter: "blur(60px)",
      }}
      className={`pointer-events-none absolute rounded-full ${className}`}
    />
  );
}
