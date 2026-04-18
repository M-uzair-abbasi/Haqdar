"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const ITEMS = [
  { n: "Fatima", c: "Karachi", a: 3240 },
  { n: "Hassan", c: "Lahore", a: 5820 },
  { n: "Ayesha", c: "Islamabad", a: 12400 },
  { n: "Bilal", c: "Rawalpindi", a: 2180 },
  { n: "Sana", c: "Faisalabad", a: 8940 },
  { n: "Usman", c: "Multan", a: 4120 },
];

export default function LiveTicker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % ITEMS.length), 3200);
    return () => clearInterval(t);
  }, []);
  const it = ITEMS[i];
  return (
    <div className="mt-5 rounded-2xl bg-accent/10 border border-accent/30 p-3 text-xs overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -18, opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-2"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
          <span>
            <strong>{it.n}</strong> from <strong>{it.c}</strong> just recovered{" "}
            <strong className="text-primary">Rs {it.a.toLocaleString()}</strong>
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
