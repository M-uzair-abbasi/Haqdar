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

// Public CORS proxies used when Vercel's server can't reach IESCO.
// The user's browser does the fetch from their Pakistani IP, bypassing
// the cloud firewall. Two proxies for failover.
const CORS_PROXIES = [
  (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
  (target: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
];

function normalizeRef(raw: string): string {
  const cleaned = (raw ?? "").replace(/\s+/g, "").toUpperCase();
  return cleaned.replace(/[A-Z]$/, "");
}

async function fetchViaProxy(target: string): Promise<string | null> {
  for (const mkUrl of CORS_PROXIES) {
    try {
      const res = await fetch(mkUrl(target), { method: "GET" });
      if (!res.ok) continue;
      const html = await res.text();
      if (html && html.length > 500) return html;
    } catch {
      // try next proxy
    }
  }
  return null;
}

export function AutoFetchCard({ userId, onFetchSuccess }: Props) {
  const [disco, setDisco] = useState<string>("IESCO");
  const [refNo, setRefNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Server-side direct scrape first (fast when it works).
  async function tryServerFetch(): Promise<{ ok: true; bill: ScrapedBill } | { ok: false; networkError: boolean; errorText: string }> {
    setLoadingStage("Fetching from IESCO…");
    try {
      const res = await fetch("/api/fetchBill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disco, referenceNumber: refNo, userId }),
      });
      const data = await res.json();
      if (data.success) return { ok: true, bill: data.bill };
      const base = data.message || "Could not fetch bill.";
      return {
        ok: false,
        networkError: data.error === "NETWORK_ERROR" || data.error === "INTERNAL_ERROR",
        errorText: data.debug ? `${base} (${data.debug})` : base,
      };
    } catch {
      return { ok: false, networkError: true, errorText: "Network error talking to our server." };
    }
  }

  // Browser-side fallback: fetch IESCO HTML via a public CORS proxy using
  // the user's Pakistani IP, then POST to /api/parseBill for server-side parsing.
  async function tryClientFetch(): Promise<{ ok: true; bill: ScrapedBill } | { ok: false; errorText: string }> {
    const normRef = normalizeRef(refNo);
    if (!/^\d{14}$/.test(normRef)) {
      return { ok: false, errorText: "Reference number must be 14 digits." };
    }
    setLoadingStage("Fetching from IESCO via your browser…");
    const targetUrl = `https://bill.pitc.com.pk/iescobill/general?refno=${normRef}`;
    const html = await fetchViaProxy(targetUrl);
    if (!html) {
      return {
        ok: false,
        errorText:
          "Could not reach IESCO from your browser either. CORS proxy may be down — please try manual entry.",
      };
    }
    setLoadingStage("Parsing bill on our server…");
    try {
      const res = await fetch("/api/parseBill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disco, referenceNumber: refNo, html, userId }),
      });
      const data = await res.json();
      if (data.success) return { ok: true, bill: data.bill };
      const base = data.message || "Could not parse bill HTML.";
      return { ok: false, errorText: data.debug ? `${base} (${data.debug})` : base };
    } catch {
      return { ok: false, errorText: "Failed to reach our parser endpoint." };
    }
  }

  async function handleFetch() {
    setError(null);
    setLoading(true);
    setLoadingStage("");
    try {
      // Stage 1: server-side direct fetch (fast path).
      const server = await tryServerFetch();
      if (server.ok) {
        onFetchSuccess(server.bill);
        return;
      }
      // Stage 2: network-level block (e.g. Vercel→IESCO) → user's browser does it.
      if (server.networkError) {
        setLoadingStage("Server blocked. Retrying from your browser…");
        const client = await tryClientFetch();
        if (client.ok) {
          onFetchSuccess(client.bill);
          return;
        }
        setError(client.errorText);
      } else {
        setError(server.errorText);
      }
    } catch {
      setError("Network error. Please try manual entry.");
    } finally {
      setLoading(false);
      setLoadingStage("");
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
              <Loader2 className="animate-spin" size={16} /> {loadingStage || "Fetching from IESCO…"}
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
