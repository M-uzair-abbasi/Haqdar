"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import ScrollReveal from "@/components/motion/ScrollReveal";
import TiltCard from "@/components/motion/TiltCard";
import Orb from "@/components/motion/Orb";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ImpactStats } from "@/types";

const DISCO_DATA = [
  { disco: "KE", count: 842 },
  { disco: "LESCO", count: 621 },
  { disco: "IESCO", count: 318 },
  { disco: "MEPCO", count: 245 },
  { disco: "GEPCO", count: 201 },
  { disco: "HESCO", count: 164 },
  { disco: "PESCO", count: 132 },
  { disco: "FESCO", count: 109 },
  { disco: "SNGPL", count: 221 },
  { disco: "SSGC", count: 97 },
];

const VIOLATION_DATA = [
  { name: "Extended cycle", value: 42 },
  { name: "Slab threshold", value: 23 },
  { name: "FPA on lifeline", value: 11 },
  { name: "Chained estimates", value: 18 },
  { name: "PUG charge", value: 6 },
];

const RECOVERY_TREND = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  amount: Math.round(10000 + i * 2500 + Math.sin(i / 3) * 5000),
}));

const COLORS = ["#1B4332", "#2D6A4F", "#D4AF37", "#C1121F", "#F59E0B"];

export default function ImpactPage() {
  const [impact, setImpact] = useState<ImpactStats | null>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [feedIdx, setFeedIdx] = useState(0);

  useEffect(() => {
    fetch("/api/impact").then((r) => r.json()).then((d) => {
      setImpact(d.impact);
      setFeed(d.feed ?? []);
    });
  }, []);

  useEffect(() => {
    if (feed.length === 0) return;
    const t = setInterval(() => setFeedIdx((i) => (i + 1) % feed.length), 4000);
    return () => clearInterval(t);
  }, [feed]);

  return (
    <>
      <Nav />
      <main>
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-mesh" />
          <div className="absolute inset-0 bg-noise opacity-70" />
          <Orb className="top-0 left-10" color="rgba(212,175,55,0.50)" size={480} />
          <Orb className="bottom-0 right-10" color="rgba(45,106,79,0.50)" size={520} delay={0.2} />

          <div className="relative max-w-6xl mx-auto px-4 text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent"
            >
              <Sparkles size={14} /> Live impact
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="mt-4 text-5xl md:text-7xl font-black leading-tight tracking-tight"
            >
              <AnimatedNumber to={impact?.total_overcharges_found ?? 3140000} prefix="₨ " className="text-gradient-light" durationMs={2400} />
              <span className="block text-white/80 text-lg md:text-2xl font-medium mt-4">
                recovered for <AnimatedNumber to={impact?.total_bills_audited ?? 2847} /> Pakistanis
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-white/70 max-w-2xl mx-auto"
            >
              Every rupee refunded is a rupee back in a Pakistani pocket. No AI. No custody. Just law.
            </motion.p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { label: "Complaints filed", v: impact?.total_complaints_filed ?? 1893 },
              { label: "Refunds received", v: impact?.total_refunds_received ?? 847000, prefix: "₨ " },
              { label: "Active users", v: impact?.active_users ?? 412 },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <TiltCard intensity={5}>
                  <div className="rounded-2xl glass p-7 tilt-card">
                    <div className="text-xs uppercase tracking-widest text-text-muted">{s.label}</div>
                    <div className="mt-2 text-4xl md:text-5xl font-extrabold text-primary">
                      <AnimatedNumber to={s.v} prefix={s.prefix ?? ""} />
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-5">
          <ScrollReveal>
            <div className="rounded-2xl bg-white border border-border p-6 shadow-sm">
              <h3 className="font-bold text-primary">Complaints by DISCO</h3>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={DISCO_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
                    <XAxis dataKey="disco" fontSize={11} stroke="#525252" />
                    <YAxis fontSize={11} stroke="#525252" />
                    <Tooltip cursor={{ fill: "rgba(27,67,50,0.05)" }} contentStyle={{ borderRadius: 12, border: "1px solid #E5E5E5" }} />
                    <Bar dataKey="count" fill="#1B4332" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="rounded-2xl bg-white border border-border p-6 shadow-sm">
              <h3 className="font-bold text-primary">Violations by pattern</h3>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={VIOLATION_DATA} dataKey="value" nameKey="name" innerRadius={55} outerRadius={105} paddingAngle={3}>
                      {VIOLATION_DATA.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E5E5" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2} className="lg:col-span-2">
            <div className="rounded-2xl bg-white border border-border p-6 shadow-sm">
              <h3 className="font-bold text-primary">Money recovered — last 30 days</h3>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={RECOVERY_TREND}>
                    <defs>
                      <linearGradient id="gold" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#1B4332" />
                        <stop offset="100%" stopColor="#D4AF37" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
                    <XAxis dataKey="day" fontSize={11} stroke="#525252" />
                    <YAxis fontSize={11} stroke="#525252" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E5E5" }} />
                    <Line type="monotone" dataKey="amount" stroke="url(#gold)" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ScrollReveal>
        </section>

        <section className="max-w-4xl mx-auto px-4 pb-24">
          <ScrollReveal>
            <h3 className="font-bold text-primary text-lg">Live feed</h3>
            <div className="mt-3 rounded-2xl bg-white border border-border p-5 min-h-[80px] flex items-center overflow-hidden">
              <AnimatePresence mode="wait">
                {feed[feedIdx] ? (
                  <motion.div
                    key={feedIdx}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="h-2 w-2 rounded-full bg-danger animate-pulse" />
                    <span>
                      <strong>{feed[feedIdx].name}</strong> from <strong>{feed[feedIdx].city}</strong> just {feed[feedIdx].action}{" "}
                      <span className="text-primary font-bold">Rs {feed[feedIdx].amount.toLocaleString()}</span>{" "}
                      <span className="text-text-muted">· {feed[feedIdx].timeAgo} ago</span>
                    </span>
                  </motion.div>
                ) : (
                  <div className="text-text-muted text-sm">Listening for activity…</div>
                )}
              </AnimatePresence>
            </div>
          </ScrollReveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
