"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import MagneticButton from "@/components/motion/MagneticButton";
import Orb from "@/components/motion/Orb";
import { CheckCircle2, AlertTriangle, Scale, Clock, FileText, ArrowRight, Info, ShieldCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Bill, OverchargeResult, AuditNotice, Confidence } from "@/types";

type ApiPayload = {
  bill: Bill;
  overcharges: OverchargeResult[];
  totalOvercharge: number;
  notices?: AuditNotice[];
};

export default function ResultsPage() {
  const params = useParams<{ billId: string }>();
  const router = useRouter();
  const [data, setData] = useState<ApiPayload | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<Record<string, "en" | "ur">>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/bill/${params.billId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setData)
      .catch(() => setErr("Could not load this audit."));
  }, [params.billId]);

  if (err) {
    return (
      <>
        <Nav />
        <main className="max-w-3xl mx-auto px-4 py-16 text-center text-danger">{err}</main>
        <Footer />
      </>
    );
  }
  if (!data) {
    return (
      <>
        <Nav />
        <main className="max-w-3xl mx-auto px-4 py-16 text-center text-text-muted">Loading audit…</main>
        <Footer />
      </>
    );
  }

  const { overcharges, totalOvercharge, bill, notices = [] } = data;

  async function generateComplaint() {
    setBusy(true);
    const res = await fetch("/api/complaint/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ billId: bill.id }),
    });
    setBusy(false);
    if (!res.ok) return;
    const { complaintId } = await res.json();
    router.push(`/complaint/${complaintId}`);
  }

  const exactCycle = overcharges.find((o) => o.actual_cycle_days)?.actual_cycle_days;
  const inferredCycle = overcharges.find((o) => o.estimated_cycle_days)?.estimated_cycle_days;
  const cycleLabel = exactCycle
    ? `${exactCycle} d`
    : inferredCycle
    ? `~${inferredCycle} d`
    : bill.billing_days && bill.billing_days > 0
    ? `${bill.billing_days} d`
    : "—";

  return (
    <>
      <Nav />
      <main className="relative">
        <div className="absolute inset-0 bg-mesh-light pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 py-10">
          {overcharges.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl glass p-10 text-center"
            >
              <CheckCircle2 className="mx-auto text-primary-light" size={56} />
              <h1 className="mt-5 text-2xl md:text-3xl font-extrabold text-primary">No NEPRA violations detected</h1>
              <p className="mt-2 text-text-muted">This bill looks clean. Save it for future comparison.</p>
              {notices.map((n, i) => (
                <NoticeCard key={i} notice={n} />
              ))}
              <button onClick={() => router.push("/scan")} className="mt-6 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-light">
                Audit Another Bill
              </button>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative overflow-hidden rounded-3xl p-8 md:p-10 text-white"
              >
                <div className="absolute inset-0 bg-mesh" />
                <div className="absolute inset-0 bg-noise opacity-60" />
                <Orb className="top-0 right-0" color="rgba(193,18,31,0.45)" size={320} />
                <Orb className="bottom-0 left-0" color="rgba(212,175,55,0.35)" size={260} delay={0.2} />

                <div className="relative flex items-start justify-between flex-wrap gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 text-sm text-danger bg-danger/15 border border-danger/30 rounded-full px-3 py-1">
                      <AlertTriangle size={14} /> {overcharges.length} NEPRA violations detected
                    </div>
                    <div className="mt-4 text-white/60 text-sm">You were overcharged</div>
                    <div className="mt-1 text-5xl md:text-7xl font-black tracking-tight">
                      <AnimatedNumber to={totalOvercharge} prefix="₨ " className="text-gradient-light" durationMs={2000} />
                    </div>
                    <p className="mt-4 text-sm text-white/70 max-w-xl">
                      This money legally belongs to you. NEPRA has <strong className="text-accent">15 working days</strong> to order refund once filed.
                    </p>
                  </div>
                  <div className="rounded-2xl glass-dark p-4 text-sm min-w-[220px]">
                    <div className="text-xs text-white/60">Bill</div>
                    <div className="font-bold text-white">{bill.disco_name}</div>
                    <div className="text-xs text-white/60 mt-1">Ref: {bill.reference_number}</div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] text-white/60 uppercase">Units</div>
                        <div className="font-bold">{bill.units_billed}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-white/60 uppercase">Cycle</div>
                        <div className="font-bold">{cycleLabel}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {notices.map((n, i) => (
                <NoticeCard key={i} notice={n} />
              ))}

              <div className="mt-6 space-y-4">
                <AnimatePresence>
                  {overcharges.map((o, i) => {
                    const key = o.id ?? String(i);
                    const active = tab[key] ?? "en";
                    const sev = o.severity === "high" ? "sev-high" : o.severity === "medium" ? "sev-medium" : "sev-low";
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className={`relative rounded-2xl bg-white border border-border p-6 shadow-sm overflow-hidden ${sev}`}
                      >
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Scale size={18} className="text-primary" />
                              <h3 className="font-bold text-primary text-lg">{o.pattern_name}</h3>
                              <ConfidenceBadge confidence={o.confidence} />
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="text-[11px] uppercase tracking-wider rounded-full bg-primary/10 text-primary px-2.5 py-1 font-semibold">
                                {o.sro_citation}
                              </span>
                              {(o.actual_cycle_days || o.estimated_cycle_days) && (
                                <span className="text-[11px] rounded-full bg-bg text-text-muted px-2.5 py-1">
                                  {o.actual_cycle_days
                                    ? `Measured cycle: ${o.actual_cycle_days} days`
                                    : `Estimated cycle: ~${o.estimated_cycle_days} days`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-3xl md:text-4xl font-extrabold text-danger">
                            <AnimatedNumber to={o.overcharge_amount} prefix="₨ " />
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center gap-2 text-xs">
                            <button onClick={() => setTab({ ...tab, [key]: "en" })} className={`rounded-full px-3 py-1 transition ${active === "en" ? "bg-primary text-white" : "bg-bg text-text-muted hover:bg-border"}`}>English</button>
                            <button onClick={() => setTab({ ...tab, [key]: "ur" })} className={`rounded-full px-3 py-1 font-urdu transition ${active === "ur" ? "bg-primary text-white" : "bg-bg text-text-muted hover:bg-border"}`}>اردو</button>
                          </div>
                          <AnimatePresence mode="wait">
                            <motion.p
                              key={active}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.25 }}
                              className={`mt-3 text-sm leading-relaxed ${active === "ur" ? "font-urdu text-right" : ""}`}
                            >
                              {active === "ur" ? o.explanation_urdu : o.explanation_english}
                            </motion.p>
                          </AnimatePresence>
                        </div>
                        <details className="mt-4 text-xs text-text-muted">
                          <summary className="cursor-pointer select-none">Evidence & calculation</summary>
                          <div className="mt-2 p-3 bg-bg rounded-lg">
                            Pattern: <code>{o.pattern_code}</code> · Severity: <code>{o.severity}</code> · Confidence: <code>{o.confidence}</code><br />
                            Bill: Rs {bill.total_amount.toLocaleString()} · Units: {bill.units_billed}
                            {o.actual_cycle_days ? <> · Cycle: {o.actual_cycle_days} days (measured)</> : null}
                            {o.estimated_cycle_days ? <> · Cycle: ~{o.estimated_cycle_days} days (estimated)</> : null}
                          </div>
                        </details>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <MagneticButton
                  onClick={generateComplaint}
                  disabled={busy}
                  className="rounded-xl bg-primary text-white px-6 py-3.5 font-semibold hover:bg-primary-light inline-flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60"
                >
                  <FileText size={18} /> Generate Complaint Letter <ArrowRight size={16} />
                </MagneticButton>
                <button onClick={() => router.push("/scan")} className="rounded-xl border border-border bg-white px-6 py-3.5 font-medium hover:bg-bg">
                  Audit Another Bill
                </button>
                <button onClick={() => router.push("/dashboard")} className="rounded-xl border border-border bg-white px-6 py-3.5 font-medium hover:bg-bg">
                  Save for Later
                </button>
              </div>

              <div className="mt-10 rounded-2xl bg-accent/10 border border-accent/30 p-5 flex items-start gap-3">
                <Clock className="mt-0.5 text-accent" size={18} />
                <div className="text-sm">
                  <strong>What happens next:</strong> Generate the bilingual PDF, choose your filing channel —
                  NEPRA's <a href="https://nepra.org.pk/CAD-Database/CMS-CAD/cregister.php" target="_blank" rel="noopener noreferrer" className="text-primary underline">web portal</a>
                  {" "}or the Asaan Approach mobile app. NEPRA has 15 working days to order a refund; we track the clock for you in your dashboard.
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  if (confidence === "high") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest rounded-full bg-primary-light/10 text-primary-light border border-primary-light/30 px-2 py-0.5 font-bold"
        title="Verified via your bill history"
      >
        <ShieldCheck size={11} /> Verified
      </span>
    );
  }
  if (confidence === "medium") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest rounded-full bg-warning/15 text-warning border border-warning/40 px-2 py-0.5 font-bold"
        title="Pattern detected from consumption history"
      >
        <Sparkles size={11} /> Inferred
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest rounded-full bg-bg text-text-muted border border-border px-2 py-0.5 font-bold">
      <Info size={11} /> Early signal
    </span>
  );
}

function NoticeCard({ notice }: { notice: AuditNotice }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-6 rounded-2xl bg-white border border-accent/30 p-5 flex items-start gap-3 shadow-sm"
    >
      <div className="h-9 w-9 rounded-lg bg-accent/15 text-accent grid place-items-center shrink-0">
        <Info size={18} />
      </div>
      <div className="text-sm">
        <div className="font-bold text-primary">{notice.title_english}</div>
        <p className="mt-1 text-text-muted leading-relaxed">{notice.body_english}</p>
      </div>
    </motion.div>
  );
}
