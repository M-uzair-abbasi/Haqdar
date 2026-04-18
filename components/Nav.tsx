"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Globe, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Tier = "free" | "pro" | "business";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "ur">("en");
  const [scrolled, setScrolled] = useState(false);
  const [tier, setTier] = useState<Tier>("pro");
  const [tierOpen, setTierOpen] = useState(false);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 16); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => setTier(((d.user?.subscription_tier as Tier) ?? "pro")))
      .catch(() => {});
  }, []);

  async function switchTier(next: Tier) {
    setTier(next);
    setTierOpen(false);
    await fetch("/api/user/tier", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tier: next }),
    }).catch(() => {});
    window.dispatchEvent(new Event("focus"));
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-border/60 shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between" style={{ height: scrolled ? 60 : 72, transition: "height .3s" }}>
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            initial={{ rotate: -10, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="h-9 w-9 rounded-xl grid place-items-center font-black text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F 60%, #D4AF37)" }}
          >
            <span>H</span>
            <span className="absolute inset-0 shimmer opacity-40" />
          </motion.div>
          <div className="leading-none">
            <div className="font-bold text-[17px] text-primary">Haqdar</div>
            <div className="text-[10px] font-urdu text-text-muted -mt-0.5">حقدار</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/scan" className="link-gold text-text-main/80 hover:text-primary">Check Bill</Link>
          <Link href="/dashboard" className="link-gold text-text-main/80 hover:text-primary">Dashboard</Link>
          <Link href="/impact" className="link-gold text-text-main/80 hover:text-primary">Impact</Link>

          {/* DEMO TIER TOGGLE — for the pitch, flip between Free/Pro/Business to see both paywall + auto-fetch */}
          <div className="relative">
            <button
              onClick={() => setTierOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                tier === "free"
                  ? "border-border bg-white/70 text-text-muted hover:bg-white"
                  : "border-accent/50 bg-accent/15 text-primary hover:bg-accent/25"
              }`}
              title="Demo tier (click to switch)"
              aria-haspopup="menu"
              aria-expanded={tierOpen}
            >
              <Crown size={12} />
              {tier.toUpperCase()}
            </button>
            <AnimatePresence>
              {tierOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl border border-border p-1 text-xs z-50"
                >
                  <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-text-muted">Demo tier</div>
                  {(["free", "pro", "business"] as Tier[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => switchTier(t)}
                      className={`w-full text-left rounded-lg px-3 py-2 hover:bg-bg ${tier === t ? "bg-primary/5 text-primary font-semibold" : ""}`}
                    >
                      {t === "free" ? "Free — sees paywall" : t === "pro" ? "Pro — auto-fetch on" : "Business — auto-fetch on"}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setLang(lang === "en" ? "ur" : "en")}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/70 hover:bg-white px-3 py-1.5 text-xs"
            aria-label="Toggle language"
          >
            <Globe size={13} /> {lang === "en" ? "اردو" : "English"}
          </button>
          <Link
            href="/scan"
            className="relative inline-flex items-center rounded-xl bg-primary text-white px-4 py-2 font-medium hover:bg-primary-light overflow-hidden group"
          >
            <span className="relative z-10">Sign In</span>
            <span className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700" />
          </Link>
        </nav>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border bg-white/90 backdrop-blur-xl overflow-hidden"
          >
            <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3 text-sm">
              <Link href="/scan" onClick={() => setOpen(false)}>Check Bill</Link>
              <Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
              <Link href="/impact" onClick={() => setOpen(false)}>Impact</Link>
              <Link href="/scan" onClick={() => setOpen(false)} className="rounded-lg bg-primary text-white text-center py-2 mt-1">Sign In</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
