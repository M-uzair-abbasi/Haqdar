"use client";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/motion/ScrollReveal";
import TiltCard from "@/components/motion/TiltCard";
import MagneticButton from "@/components/motion/MagneticButton";
import Orb from "@/components/motion/Orb";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { motion } from "framer-motion";

async function setTier(tier: "free" | "pro" | "business") {
  await fetch("/api/user/tier", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tier }),
  });
  window.dispatchEvent(new Event("focus"));
}

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className="relative">
        <div className="absolute inset-0 bg-mesh-light pointer-events-none" />
        <Orb className="-top-10 -left-10" color="rgba(212,175,55,0.35)" size={420} />
        <Orb className="top-20 right-0" color="rgba(45,106,79,0.25)" size={360} delay={0.2} />

        <section className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <ScrollReveal className="text-center">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary-light">
              <Sparkles size={14} /> Pricing
            </div>
            <h1 className="mt-3 text-4xl md:text-6xl font-extrabold text-primary tracking-tight">
              Start free. Upgrade when your refund arrives.
            </h1>
            <p className="mt-4 text-text-muted max-w-2xl mx-auto">
              Manual entry is always free. Pro unlocks the live IESCO auto-fetch and priority complaint filing.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            <TiltCard intensity={5}>
              <Plan name="Free" price="₨ 0" period="forever" features={["Manual bill entry", "5 NEPRA rule checks", "PDF complaint generation"]} cta="Stay on Free" onClick={() => setTier("free")} />
            </TiltCard>
            <TiltCard intensity={6}>
              <Plan highlight name="Pro" price="₨ 60" period="per month" features={["Live auto-fetch (IESCO now, LESCO/MEPCO/GEPCO soon)", "Unlimited bill audits", "Priority complaint filing", "Refund tracking timeline", "Bilingual PDF exports"]} cta="Switch to Pro" onClick={() => setTier("pro")} icon={<Crown size={14} />} />
            </TiltCard>
            <TiltCard intensity={5}>
              <Plan name="Business" price="₨ 120" period="per meter / mo" features={["Everything in Pro", "Multi-meter dashboards", "Bulk CSV upload", "Priority support"]} cta="Switch to Business" onClick={() => setTier("business")} icon={<Zap size={14} />} />
            </TiltCard>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-14 rounded-3xl glass p-6 md:p-8"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary-light">
              <Sparkles size={14} /> How auto-fetch works
            </div>
            <h2 className="mt-2 text-2xl font-bold text-primary">Type your reference. We do the rest.</h2>
            <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm text-text-muted">
              <Step n={1} title="Paste 14-digit ref" body="Found top-right of your IESCO paper bill, labeled &ldquo;REFERENCE NO&rdquo;." />
              <Step n={2} title="We fetch live" body="Secure call to the official PITC bill portal. No CAPTCHA, no OTP. Takes ~3 seconds." />
              <Step n={3} title="Audit runs" body="All 5 NEPRA rules apply to the fetched data. You review and confirm before filing." />
            </div>
          </motion.div>

          <div className="mt-10 text-center text-text-muted text-sm">
            <Link href="/scan" className="text-primary underline-offset-4 hover:underline">Back to bill scan →</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Plan({ name, price, period, features, highlight, cta, onClick, icon }: { name: string; price: string; period: string; features: string[]; highlight?: boolean; cta: string; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <div
      className={`relative h-full rounded-2xl p-7 overflow-hidden tilt-card ${highlight ? "text-white shadow-2xl" : "bg-white border border-border"}`}
      style={highlight ? { background: "linear-gradient(140deg, #1B4332 0%, #2D6A4F 60%, #1B4332 100%)" } : undefined}
    >
      {highlight && (
        <>
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
          <div className="absolute inset-0 bg-noise opacity-40" />
        </>
      )}
      <div className="relative flex items-baseline justify-between">
        <div className="inline-flex items-center gap-2">
          {icon && <span className={highlight ? "text-accent" : "text-primary"}>{icon}</span>}
          <h3 className={`font-semibold ${highlight ? "text-white" : "text-primary"}`}>{name}</h3>
        </div>
        {highlight && <span className="text-[10px] rounded-full bg-accent text-primary px-2 py-0.5 font-bold uppercase tracking-wider">Most popular</span>}
      </div>
      <div className="relative mt-5 flex items-baseline gap-1">
        <div className={`text-4xl md:text-5xl font-extrabold ${highlight ? "text-white" : "text-primary"}`}>{price}</div>
        <div className={`text-sm ${highlight ? "text-white/70" : "text-text-muted"}`}>/{period}</div>
      </div>
      <ul className={`relative mt-5 space-y-2.5 text-sm ${highlight ? "text-white/90" : "text-text-main"}`}>
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check size={16} className={highlight ? "text-accent mt-0.5" : "text-primary-light mt-0.5"} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="relative mt-7">
        <MagneticButton
          onClick={onClick}
          className={`block w-full text-center rounded-xl py-2.5 font-semibold ${highlight ? "bg-accent text-primary hover:brightness-105" : "bg-primary text-white hover:bg-primary-light"}`}
        >
          {cta}
        </MagneticButton>
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="rounded-xl bg-white/60 border border-border p-4">
      <div className="text-[10px] uppercase tracking-widest text-primary-light">Step {n}</div>
      <div className="mt-1 font-bold text-primary">{title}</div>
      <p className="mt-1 text-text-muted text-sm leading-relaxed">{body}</p>
    </div>
  );
}
