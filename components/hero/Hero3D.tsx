"use client";
import { useRef, MouseEvent } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Zap, Receipt, ShieldCheck, Flame, TrendingDown } from "lucide-react";

export default function Hero3D() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useSpring(0, { stiffness: 80, damping: 12 });
  const my = useSpring(0, { stiffness: 80, damping: 12 });
  const rotX = useTransform(my, [-1, 1], [8, -8]);
  const rotY = useTransform(mx, [-1, 1], [-12, 12]);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }
  function onLeave() { mx.set(0); my.set(0); }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative perspective w-full aspect-[4/5] sm:aspect-[5/6] md:aspect-[4/5] max-w-md mx-auto"
    >
      <motion.div
        style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
        className="absolute inset-0 preserve-3d"
      >
        <div
          aria-hidden
          className="absolute inset-6 rounded-[2rem]"
          style={{
            background: "radial-gradient(closest-side, rgba(212,175,55,.45), transparent 70%)",
            transform: "translateZ(-120px)",
            filter: "blur(40px)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ transform: "translateZ(-60px) rotate(-7deg)" }}
          className="absolute top-[6%] left-[8%] w-[68%] aspect-[3/4] rounded-2xl glass-dark p-5 text-white/90"
        >
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/60">
            <span className="flex items-center gap-1"><Zap size={12} /> K-Electric</span>
            <span>Bill · 34 days</span>
          </div>
          <div className="mt-6 text-[10px] text-white/50">Units billed</div>
          <div className="text-2xl font-bold">325 kWh</div>
          <div className="mt-4 h-px bg-white/10" />
          <div className="mt-3 text-[10px] text-white/50">Total amount</div>
          <div className="text-2xl font-bold text-danger">Rs 18,500</div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-warning">
            <Flame size={12} /> Pushed past 300-unit slab
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ transform: "translateZ(40px) rotate(4deg)" }}
          className="absolute bottom-[4%] right-[6%] w-[70%] aspect-[3/4] rounded-2xl glass p-5 float-y"
        >
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-primary">
            <span className="flex items-center gap-1"><ShieldCheck size={12} /> NEPRA audit</span>
            <span className="rounded-full bg-danger/10 text-danger px-2 py-0.5 font-semibold normal-case tracking-normal">
              2 violations
            </span>
          </div>
          <div className="mt-4">
            <div className="text-[10px] uppercase text-text-muted">You were overcharged</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-danger">₨ 13,963</span>
              <TrendingDown size={16} className="text-danger" />
            </div>
            <div className="mt-1 text-[10px] text-text-muted">via Extended Billing Cycle</div>
          </div>
          <div className="mt-4 grid gap-2">
            <ViolationChip name="Extended Billing Cycle" cite="SRO 1142(I)/2020" amount="₨ 13,963" />
            <ViolationChip name="Chained Estimates" cite="CSM 2021" amount="₨ 1,850" />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10px] text-text-muted">15-day clock</span>
            <div className="h-1.5 w-24 rounded-full bg-border overflow-hidden">
              <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: "60%" }} transition={{ delay: 1.2, duration: 1.1 }} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          style={{ transform: "translateZ(80px)" }}
          className="absolute top-[8%] right-[12%]"
        >
          <motion.div
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 7, ease: "linear", repeat: Infinity }}
            className="h-14 w-14 rounded-full"
            style={{
              background: "conic-gradient(from 140deg, #D4AF37, #F5E6A3, #D4AF37, #8B6F1A, #D4AF37)",
              boxShadow: "0 12px 30px -8px rgba(212,175,55,.55)",
            }}
          >
            <div className="h-full w-full rounded-full grid place-items-center text-[10px] font-black text-[#6B5411]">₨</div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          style={{ transform: "translateZ(100px)" }}
          className="absolute bottom-[12%] left-[4%] rounded-2xl glass px-3 py-2 text-xs flex items-center gap-2 shadow-xl"
        >
          <div className="h-7 w-7 rounded-lg bg-primary text-white grid place-items-center">
            <Receipt size={14} />
          </div>
          <div>
            <div className="font-semibold text-primary">Refund ready</div>
            <div className="text-[10px] text-text-muted">in 15 days</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function ViolationChip({ name, cite, amount }: { name: string; cite: string; amount: string }) {
  return (
    <div className="rounded-xl bg-bg/80 border border-border p-2 flex items-center justify-between">
      <div>
        <div className="text-[11px] font-semibold text-primary leading-tight">{name}</div>
        <div className="text-[9px] text-text-muted">{cite}</div>
      </div>
      <div className="text-[11px] font-bold text-danger">{amount}</div>
    </div>
  );
}
