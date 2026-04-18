"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import TiltCard from "@/components/motion/TiltCard";
import Link from "next/link";
import { fmtPKR } from "@/lib/utils";
import { FileText, Scale, FilePlus2, Clock, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Bill, Complaint, OverchargeResult } from "@/types";

type BillWithOvercharges = Bill & { overcharges: OverchargeResult[] };

type DashData = {
  bills: BillWithOvercharges[];
  complaints: Complaint[];
  stats: {
    totalBills: number;
    totalViolations: number;
    totalViolationsAmount: number;
    totalFiled: number;
    totalRefunds: number;
  };
};

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [tab, setTab] = useState<"bills" | "complaints" | "refunds">("bills");

  useEffect(() => { fetch("/api/dashboard").then((r) => r.json()).then(setData); }, []);

  if (!data) {
    return (
      <>
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-10 text-text-muted">Loading dashboard…</main>
        <Footer />
      </>
    );
  }

  const empty = data.stats.totalBills === 0;

  return (
    <>
      <Nav />
      <main className="relative">
        <div className="absolute inset-0 bg-mesh-light pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary-light">Your dashboard</div>
              <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-primary tracking-tight">Every rupee you're owed.</h1>
              <p className="text-text-muted text-sm mt-1">Every audit, every complaint, every refund in one place.</p>
            </div>
            <Link href="/scan" className="group inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-light shadow-lg shadow-primary/20">
              <Plus size={16} /> Audit a bill
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Tile i={0} icon={<FileText />} label="Bills audited" value={<AnimatedNumber to={data.stats.totalBills} />} />
            <Tile i={1} icon={<Scale />} label="Violations detected" value={<><AnimatedNumber to={data.stats.totalViolations} /> <span className="text-sm font-medium">· <span className="text-danger">{fmtPKR(data.stats.totalViolationsAmount)}</span></span></>} />
            <Tile i={2} icon={<FilePlus2 />} label="Complaints filed" value={<AnimatedNumber to={data.stats.totalFiled} />} />
            <Tile i={3} icon={<Clock />} label="Refunds received" value={<AnimatedNumber to={data.stats.totalRefunds} prefix="₨ " />} />
          </div>

          {empty ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 rounded-3xl glass p-12 text-center"
            >
              <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary grid place-items-center">
                <FileText size={22} />
              </div>
              <div className="mt-4 text-primary font-extrabold text-2xl">Audit your first bill</div>
              <p className="text-text-muted text-sm mt-2">Takes 30 seconds. You might be owed thousands.</p>
              <Link href="/scan" className="mt-6 inline-block bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-light shadow-lg shadow-primary/20">
                Check Your Bill
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="mt-8 inline-flex rounded-xl border border-border bg-white overflow-hidden text-sm shadow-sm">
                {(["bills", "complaints", "refunds"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-5 py-2.5 transition-all ${tab === t ? "bg-primary text-white" : "bg-white hover:bg-bg"}`}
                  >
                    {t === "bills" ? "My Bills" : t === "complaints" ? "My Complaints" : "Track Refunds"}
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-white border border-border overflow-hidden shadow-sm">
                <AnimatePresence mode="wait">
                  {tab === "bills" && (
                    <motion.div key="bills" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <table className="w-full text-sm">
                        <thead className="bg-bg text-left text-xs uppercase tracking-widest text-text-muted">
                          <tr>
                            <th className="p-4">DISCO</th>
                            <th className="p-4">Reference</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Violations</th>
                            <th className="p-4">Overcharge</th>
                            <th className="p-4"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.bills.map((b) => {
                            const total = (b.overcharges ?? []).reduce((s, o) => s + o.overcharge_amount, 0);
                            return (
                              <tr key={b.id} className="border-t border-border hover:bg-bg/60 transition-colors">
                                <td className="p-4 font-bold text-primary">{b.disco_name}</td>
                                <td className="p-4">{b.reference_number}</td>
                                <td className="p-4">Rs {b.total_amount.toLocaleString()}</td>
                                <td className="p-4">{b.overcharges.length}</td>
                                <td className={`p-4 ${total > 0 ? "text-danger font-bold" : ""}`}>{fmtPKR(total)}</td>
                                <td className="p-4"><Link href={`/results/${b.id}`} className="text-primary hover:underline font-medium">View →</Link></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                  {tab === "complaints" && (
                    <motion.div key="complaints" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <table className="w-full text-sm">
                        <thead className="bg-bg text-left text-xs uppercase tracking-widest text-text-muted">
                          <tr>
                            <th className="p-4">Regulator</th>
                            <th className="p-4">Refund claimed</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Filed at</th>
                            <th className="p-4"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.complaints.map((c) => (
                            <tr key={c.id} className="border-t border-border hover:bg-bg/60">
                              <td className="p-4">{c.regulator}</td>
                              <td className="p-4 font-bold">{fmtPKR(c.total_refund_claimed)}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1 font-semibold ${c.status === "filed" ? "bg-primary/10 text-primary" : c.status === "resolved" ? "bg-primary-light/10 text-primary-light" : "bg-bg text-text-muted"}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${c.status === "filed" ? "bg-primary animate-pulse" : c.status === "resolved" ? "bg-primary-light" : "bg-text-muted"}`} />
                                  {c.status}
                                </span>
                              </td>
                              <td className="p-4">{c.filed_at ? new Date(c.filed_at).toLocaleDateString("en-PK") : "—"}</td>
                              <td className="p-4"><Link href={`/complaint/${c.id}`} className="text-primary hover:underline font-medium">View →</Link></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                  {tab === "refunds" && (
                    <motion.div key="refunds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-4">
                      {data.complaints.length === 0 && <div className="text-text-muted text-sm">No complaints filed yet.</div>}
                      {data.complaints.map((c) => {
                        const filedAt = c.filed_at ? new Date(c.filed_at) : null;
                        const deadline = filedAt ? new Date(filedAt.getTime() + 15 * 86400000) : null;
                        const daysLeft = deadline ? Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400000)) : 15;
                        const progress = filedAt ? Math.min(100, ((15 - daysLeft) / 15) * 100) : 0;
                        return (
                          <div key={c.id} className="rounded-2xl border border-border p-5 bg-bg/40">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="text-sm">
                                <strong>{fmtPKR(c.total_refund_claimed)}</strong> claimed from <strong>{c.disco_name}</strong>
                              </div>
                              <div className="text-xs text-text-muted">Ref: {c.reference_number}</div>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-border overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: "linear-gradient(90deg, #1B4332, #D4AF37)" }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                              />
                            </div>
                            <div className="mt-2 text-xs text-text-muted">
                              {filedAt ? `${daysLeft} days left on NEPRA's 15-day statutory clock` : "Not filed yet — 15-day clock starts when you file"}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Tile({ icon, label, value, i }: { icon: React.ReactNode; label: string; value: React.ReactNode; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard intensity={6}>
        <div className="relative overflow-hidden h-full rounded-2xl bg-white border border-border p-5 tilt-card">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">{icon}</div>
          <div className="relative mt-3 text-[10px] uppercase tracking-widest text-text-muted">{label}</div>
          <div className="relative mt-1 text-2xl md:text-3xl font-extrabold text-primary">{value}</div>
        </div>
      </TiltCard>
    </motion.div>
  );
}
