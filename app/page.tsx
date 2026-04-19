"use client";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Hero3D from "@/components/hero/Hero3D";
import LiveTicker from "@/components/hero/LiveTicker";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import ScrollReveal from "@/components/motion/ScrollReveal";
import TiltCard from "@/components/motion/TiltCard";
import MagneticButton from "@/components/motion/MagneticButton";
import SplitText from "@/components/motion/SplitText";
import Orb from "@/components/motion/Orb";
import { FileText, Scale, Banknote, ShieldCheck, ChevronRight, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const DISCOS = ["K-Electric", "LESCO", "IESCO", "MEPCO", "GEPCO", "HESCO", "PESCO", "FESCO", "SNGPL", "SSGC"];

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-mesh-light">
          <div className="absolute inset-0 bg-grid opacity-60" />
          <div className="absolute inset-0 bg-noise opacity-60" />
          <Orb className="-top-20 -left-20" color="rgba(45,106,79,0.35)" size={520} />
          <Orb className="-top-10 right-0" color="rgba(212,175,55,0.30)" size={460} delay={0.3} />

          <div className="relative max-w-6xl mx-auto px-4 pt-14 pb-24 md:pt-20 md:pb-28">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 rounded-full border border-danger/20 bg-white/80 backdrop-blur px-3 py-1 text-xs text-danger shadow-sm"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
                  NEPRA 2024 inquiry: Rs 3.572 billion stolen in 6 months
                </motion.div>

                <h1 className="mt-6 text-[2.5rem] sm:text-5xl md:text-6xl font-extrabold leading-[1.02] tracking-tight">
                  <span className="block overflow-hidden">
                    <SplitText text="Pakistan's" className="text-primary" />
                  </span>
                  <span className="block overflow-hidden mt-1">
                    <SplitText text="Refund Button." className="text-gradient" delay={0.35} />
                  </span>
                </h1>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.6 }}
                  className="mt-3 text-2xl md:text-3xl font-urdu text-primary-light"
                >
                  پاکستان کا ریفنڈ بٹن
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3, duration: 0.6 }}
                  className="mt-6 text-lg text-text-muted max-w-xl"
                >
                  Rs 3.5 billion was stolen from 3 million Pakistanis in six months — using tricks NEPRA itself documented.
                  Type 6 fields from your bill. Get your share back in 30 seconds.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="mt-8 flex flex-col sm:flex-row gap-3"
                >
                  <Link href="/scan" className="inline-flex">
                    <MagneticButton className="relative inline-flex items-center gap-2 rounded-xl bg-primary text-white px-6 py-3.5 font-semibold shadow-lg shadow-primary/20 overflow-hidden">
                      <span className="relative z-10">Check Your Bill — Free</span>
                      <ChevronRight size={18} className="relative z-10" />
                      <span className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/40 to-accent/0 translate-x-[-120%] group-hover:translate-x-[120%]" />
                    </MagneticButton>
                  </Link>
                  <a
                    href="#how"
                    className="rounded-xl border border-border bg-white/80 backdrop-blur px-6 py-3.5 font-medium hover:bg-white inline-flex items-center justify-center"
                  >
                    See How It Works
                  </a>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.7 }}
                  className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-muted"
                >
                  <div className="flex items-center gap-1"><Check size={14} className="text-primary-light" /> No AI — fully auditable</div>
                  <div className="flex items-center gap-1"><Check size={14} className="text-primary-light" /> Every flag cites an SRO</div>
                  <div className="flex items-center gap-1"><Check size={14} className="text-primary-light" /> We never hold your money</div>
                </motion.div>

                <LiveTicker />
              </div>

              {/* 3D hero */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <Hero3D />
              </motion.div>
            </div>
          </div>

          {/* DISCO marquee */}
          <div className="relative border-y border-border bg-white/50 backdrop-blur-sm py-4 overflow-hidden">
            <div className="marquee text-text-muted text-sm whitespace-nowrap">
              {[...DISCOS, ...DISCOS].map((d, i) => (
                <span key={i} className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {d}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="relative max-w-6xl mx-auto px-4 py-24">
          <ScrollReveal className="text-center">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary-light">
              <Sparkles size={14} /> How it works
            </div>
            <h2 className="mt-3 text-3xl md:text-5xl font-extrabold text-primary tracking-tight">
              30 seconds. 6 fields. 1 button.
            </h2>
            <p className="mt-3 text-text-muted max-w-2xl mx-auto">
              From bill → violation → complaint → refund. No uploads, no photos. Just the numbers you already have in your hand.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              { icon: <FileText />, n: 1, title: "Type 6 fields", body: "Reference, units, dates, amount, tariff, reading type. That's it." },
              { icon: <Scale />, n: 2, title: "5 NEPRA rules run", body: "Deterministic checks against NEPRA's own 2024 violation patterns." },
              { icon: <Banknote />, n: 3, title: "File → refund", body: "Bilingual PDF generated. 15-day statutory clock. Refund in your next bill." },
            ].map((s, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <TiltCard className="h-full">
                  <div className="relative h-full rounded-2xl bg-white border border-border p-7 tilt-card overflow-hidden">
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
                    <div className="relative h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center">{s.icon}</div>
                    <div className="relative mt-5 text-[11px] uppercase tracking-widest text-text-muted">Step {s.n}</div>
                    <h3 className="relative mt-1 text-xl font-bold text-primary">{s.title}</h3>
                    <p className="relative mt-3 text-sm text-text-muted leading-relaxed">{s.body}</p>
                  </div>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* THE DATA */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-mesh" />
          <div className="absolute inset-0 bg-noise opacity-70" />
          <Orb className="top-10 left-10" color="rgba(212,175,55,0.45)" size={360} />
          <Orb className="bottom-0 right-0" color="rgba(45,106,79,0.45)" size={420} delay={0.2} />

          <div className="relative max-w-6xl mx-auto px-4 text-white">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent">
                <Sparkles size={14} /> The data
              </div>
              <h2 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight">
                <span className="text-gradient-light">Why this matters</span>
              </h2>
              <p className="mt-3 text-white/70 max-w-2xl">
                Every number below comes from NEPRA's own 2024 State of Industry Report.
              </p>
            </ScrollReveal>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
              <BigStat to={3080186} label="consumers overcharged" />
              <BigStat to={3572} suffix=" Cr" label="Rs stolen in 6 months" />
              <BigStat to={5100000} label="bills with wrong cycles" />
              <BigStat to={6862} label="K-Electric complaints (FY24)" />
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="relative max-w-6xl mx-auto px-4 py-24">
          <ScrollReveal className="text-center">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary-light">
              <Sparkles size={14} /> Pricing
            </div>
            <h2 className="mt-3 text-3xl md:text-5xl font-extrabold text-primary tracking-tight">
              Start free. Upgrade when your refund arrives.
            </h2>
          </ScrollReveal>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              { name: "Free Trial", price: "₨ 0", period: "14 days", features: ["All features", "1 bill audit per day", "PDF complaint generation"] },
              { name: "Pro", price: "₨ 60", period: "per month", highlight: true, features: ["Unlimited bill audits", "Priority complaint filing", "Refund tracking timeline", "Bilingual PDF exports"] },
              { name: "Business", price: "₨ 120", period: "per meter / mo", features: ["For factories, schools, hospitals", "Multi-meter dashboards", "Bulk CSV upload", "Priority support"] },
            ].map((p, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <TiltCard intensity={6}>
                  <PricingCard {...p} />
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* TRUST */}
        <section className="relative py-20 border-t border-border bg-white">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
            <ScrollReveal>
              <TrustCard icon={<ShieldCheck />} title="Built on NEPRA's 2024 Inquiry" body="Every detection rule maps to a documented pattern in NEPRA's public findings." />
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <TrustCard icon={<Scale />} title="Every flag cites a law" body="No guesses. Every overcharge we detect points to a specific NEPRA SRO or OGRA rule." />
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <TrustCard icon={<Check />} title="No AI. No custody." body="Rule-based, deterministic detection. Refund flows DISCO → you. We never hold your money." />
            </ScrollReveal>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-24">
          <div className="max-w-4xl mx-auto px-4">
            <ScrollReveal>
              <div className="relative overflow-hidden rounded-3xl p-10 md:p-14 text-center text-white">
                <div className="absolute inset-0 bg-mesh" />
                <div className="absolute inset-0 bg-noise opacity-60" />
                <div className="relative">
                  <h3 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                    <span className="text-gradient-light">Your rupees. Your right.</span>
                  </h3>
                  <p className="mt-4 text-white/80 max-w-xl mx-auto">
                    The average Haqdar user recovers Rs 5,400 from their first audit.
                    Most audits find at least one NEPRA violation.
                  </p>
                  <div className="mt-8 inline-flex">
                    <Link href="/scan">
                      <MagneticButton className="rounded-xl bg-accent text-primary px-6 py-3.5 font-bold shadow-xl inline-flex items-center gap-2">
                        Check Your Bill <ChevronRight size={18} />
                      </MagneticButton>
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function BigStat({ to, label, suffix = "" }: { to: number; label: string; suffix?: string }) {
  return (
    <div className="relative rounded-2xl glass-dark p-6">
      <div className="text-3xl md:text-5xl font-extrabold text-gradient-light">
        <AnimatedNumber to={to} suffix={suffix} />
      </div>
      <div className="mt-2 text-sm text-white/70">{label}</div>
    </div>
  );
}

function PricingCard({ name, price, period, features, highlight }: { name: string; price: string; period: string; features: string[]; highlight?: boolean }) {
  return (
    <div
      className={`relative h-full rounded-2xl p-7 overflow-hidden tilt-card ${
        highlight
          ? "text-white shadow-2xl"
          : "bg-white border border-border shadow-sm"
      }`}
      style={
        highlight
          ? { background: "linear-gradient(140deg, #1B4332 0%, #2D6A4F 60%, #1B4332 100%)" }
          : undefined
      }
    >
      {highlight && (
        <>
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
          <div className="absolute inset-0 bg-noise opacity-40" />
        </>
      )}
      <div className="relative flex items-baseline justify-between">
        <h3 className={`font-semibold ${highlight ? "text-white" : "text-primary"}`}>{name}</h3>
        {highlight && <span className="text-[10px] rounded-full bg-accent text-primary px-2 py-0.5 font-bold uppercase tracking-wider">Most popular</span>}
      </div>
      <div className="relative mt-5 flex items-baseline gap-1">
        <div className={`text-4xl md:text-5xl font-extrabold ${highlight ? "text-white" : "text-primary"}`}>{price}</div>
        <div className={`text-sm ${highlight ? "text-white/70" : "text-text-muted"}`}>/{period}</div>
      </div>
      <ul className={`relative mt-6 space-y-2.5 text-sm ${highlight ? "text-white/90" : "text-text-main"}`}>
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check size={16} className={highlight ? "text-accent mt-0.5" : "text-primary-light mt-0.5"} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="relative mt-7">
        <Link href="/scan" className={`block text-center rounded-xl py-2.5 font-semibold ${highlight ? "bg-accent text-primary hover:brightness-105" : "bg-primary text-white hover:bg-primary-light"}`}>
          {highlight ? "Start free trial" : "Choose plan"}
        </Link>
      </div>
    </div>
  );
}

function TrustCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="h-full rounded-2xl bg-bg p-7 border border-border tilt-card">
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">{icon}</div>
      <h3 className="mt-4 font-bold text-primary">{title}</h3>
      <p className="mt-2 text-sm text-text-muted leading-relaxed">{body}</p>
    </div>
  );
}
