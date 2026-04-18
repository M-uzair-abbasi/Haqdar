"use client";
import { useState } from "react";
import { Loader2, Zap, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ScrapedBill } from "@/lib/scrapers";
import MagneticButton from "@/components/motion/MagneticButton";

interface Props {
  userId: string;
  onFetchSuccess: (bill: ScrapedBill) => void;
}

export function AutoFetchCard({ userId, onFetchSuccess }: Props) {
  const [disco, setDisco] = useState<string>("IESCO");
  const [refNo, setRefNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/fetchBill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disco, referenceNumber: refNo, userId }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Could not fetch bill. Please try manual entry.");
        return;
      }
      onFetchSuccess(data.bill);
    } catch {
      setError("Network error. Please try manual entry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-6 md:p-7 text-white"
      style={{ background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 55%, #1B4332 100%)" }}
    >
      <div className="absolute inset-0 bg-noise opacity-40" />
      <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />

      <div className="relative flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-accent text-primary grid place-items-center">
          <Zap size={16} />
        </div>
        <div>
          <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-accent font-semibold">
            <Sparkles size={10} /> Pro feature
          </div>
          <h3 className="font-bold text-lg leading-tight">Auto-fetch your bill</h3>
        </div>
      </div>
      <p className="relative text-sm text-white/80 mt-3">
        Paste your IESCO reference number. We'll pull every field from the official portal in ~3 seconds.
      </p>

      <div className="relative mt-5 grid gap-3">
        <div>
          <label className="text-xs uppercase tracking-widest text-white/60">DISCO</label>
          <select
            value={disco}
            onChange={(e) => setDisco(e.target.value)}
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-accent/60"
          >
            <option value="IESCO" className="text-text-main">IESCO — Live ✓</option>
            <option disabled className="text-text-main">LESCO — Coming soon</option>
            <option disabled className="text-text-main">MEPCO — Coming soon</option>
            <option disabled className="text-text-main">GEPCO — Coming soon</option>
            <option disabled className="text-text-main">FESCO — Coming soon</option>
            <option disabled className="text-text-main">PESCO — Coming soon</option>
            <option disabled className="text-text-main">HESCO — Coming soon</option>
            <option disabled className="text-text-main">K-Electric — Coming soon</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-white/60">Reference number</label>
          <input
            type="text"
            value={refNo}
            onChange={(e) => setRefNo(e.target.value)}
            placeholder="03 14217 0793600 U"
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-[15px] font-mono tracking-widest text-white placeholder-white/40 backdrop-blur focus:outline-none focus:ring-2 focus:ring-accent/60"
          />
          <div className="text-[10px] text-white/50 mt-1">
            Found on the top-right of your paper bill, labeled "REFERENCE NO"
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-start gap-2 p-3 rounded-xl bg-danger/25 border border-danger/40 text-sm"
            >
              <AlertCircle className="mt-0.5 flex-shrink-0" size={16} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <MagneticButton
          onClick={handleFetch}
          disabled={loading || !refNo.trim()}
          className="relative mt-2 rounded-xl bg-accent text-primary font-bold px-4 py-3.5 hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-xl shadow-accent/30"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={16} /> Fetching from IESCO…
            </>
          ) : (
            <>
              <Zap size={16} /> Auto-fetch bill
            </>
          )}
        </MagneticButton>
      </div>

      <div className="relative mt-5 flex items-center gap-2 text-[11px] text-white/60">
        <CheckCircle2 size={12} className="text-accent" />
        Encrypted connection · 24h cache · never stored with your name
      </div>
    </motion.div>
  );
}
