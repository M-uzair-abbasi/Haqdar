"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TiltCard from "@/components/motion/TiltCard";
import MagneticButton from "@/components/motion/MagneticButton";
import { AutoFetchCard } from "@/components/AutoFetchCard";
import { AutoFetchPaywall } from "@/components/AutoFetchPaywall";
import { canUseAutoFetch } from "@/lib/subscription";
import { DISCO_LIST, TARIFF_CATEGORIES, READING_TYPES } from "@/lib/slabs";
import { Loader2, ChevronRight, ArrowLeft, Zap, Flame, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ScrapedBill } from "@/lib/scrapers";
import type { UserRecord, HistoricalBillEntry } from "@/types";

function parseIescoDate(s?: string): string {
  if (!s) return "";
  const m = s.match(/^(\d{1,2})-([A-Z]{3})-(\d{2,4})$/i);
  if (!m) return "";
  const months: Record<string, string> = {
    JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
    JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
  };
  const mm = months[m[2].toUpperCase()];
  if (!mm) return "";
  const day = m[1].padStart(2, "0");
  const yearPart = m[3];
  const year = yearPart.length === 2 ? "20" + yearPart : yearPart;
  return `${year}-${mm}-${day}`;
}

function tariffFromIesco(iescoTariff: string, units: number): string {
  const t = (iescoTariff || "").toUpperCase();
  if (t.startsWith("A-2") || t.includes("COMMERCIAL")) return "commercial_a2";
  if (t.startsWith("A-3") || t.includes("INDUSTRIAL")) return "industrial_a3";
  if (units <= 50) return "lifeline";
  if (units <= 200) return "protected_domestic";
  return "unprotected_domestic";
}

export default function ScanPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [disco, setDisco] = useState<string>("");
  const [user, setUser] = useState<UserRecord | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [form, setForm] = useState({
    referenceNumber: "",
    units: "",
    dateFrom: "",        // Cycle start — read from user's previous paper bill
    readingDate: "",     // Cycle end — the date printed on this bill
    billMonth: "",       // e.g. "APR 26"
    amount: "",
    tariff: "protected_domestic",
    readingType: "actual",
    fpa: "",
    pugCharge: "",
  });
  // True when dateFrom was populated from a prior audit (shows a green badge).
  const [dateFromAutoFilled, setDateFromAutoFilled] = useState(false);
  // Hidden: 12-row consumption history from auto-fetch, threaded into the audit submit.
  const [historicalBills, setHistoricalBills] = useState<HistoricalBillEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/user").then((r) => r.json()).then((d) => setUser(d.user)).catch(() => {});
  }, []);

  // Refetch on window focus so Nav tier toggle reflects instantly.
  useEffect(() => {
    function onFocus() {
      fetch("/api/user").then((r) => r.json()).then((d) => setUser(d.user)).catch(() => {});
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Real bills don't carry a cycle-start date, so we no longer compute or
  // display "days" on the manual form. The detection engine infers cycle
  // length from a stored previous bill or embedded consumption history.

  const selected = DISCO_LIST.find((d) => d.id === disco);
  const isGas = selected?.type === "gas";
  const showAutoFetch = disco === "IESCO";
  const canAutoFetch = canUseAutoFetch(user?.subscription_tier, user?.subscription_status);

  // Query stored bills for a previous cycle end on the same reference,
  // so we can pre-fill Reading Date From and fire HIGH-confidence Tier 3
  // detection on the first audit after any prior bill exists.
  async function lookupPreviousCycleDate(refNo: string): Promise<string | null> {
    if (!refNo.trim()) return null;
    try {
      const res = await fetch(`/api/bills/previous?referenceNumber=${encodeURIComponent(refNo.trim())}`);
      if (!res.ok) return null;
      const d = await res.json();
      return d.readingDate ?? null;
    } catch {
      return null;
    }
  }

  async function onFetchSuccess(bill: ScrapedBill) {
    const readingDate = parseIescoDate(bill.reading_date) || parseIescoDate(bill.issue_date);
    const normRef = bill.reference_number?.replace(/\s/g, "") || "";
    setForm((f) => ({
      ...f,
      referenceNumber: normRef || f.referenceNumber,
      units: String(bill.units_billed || ""),
      amount: String(bill.payable_within_due_date || ""),
      fpa: String(bill.fuel_price_adjustment || ""),
      tariff: tariffFromIesco(bill.tariff, bill.units_billed),
      readingDate,
      billMonth: bill.bill_month ?? "",
      readingType: "actual",
    }));
    setHistoricalBills(Array.isArray(bill.historical_bills) ? bill.historical_bills : []);
    setFetchedAt(new Date().toISOString());
    setErr("");

    // Attempt to auto-fill Reading Date From from the user's last audit.
    const priorReading = await lookupPreviousCycleDate(normRef);
    if (priorReading) {
      setForm((f) => ({ ...f, dateFrom: priorReading }));
      setDateFromAutoFilled(true);
    }
  }

  // When the user finishes typing the reference number on the manual form,
  // try the same prefill (so they also get Tier 3 without touching dateFrom).
  async function onReferenceBlur() {
    if (dateFromAutoFilled || form.dateFrom) return; // already populated
    const priorReading = await lookupPreviousCycleDate(form.referenceNumber);
    if (priorReading) {
      setForm((f) => ({ ...f, dateFrom: priorReading }));
      setDateFromAutoFilled(true);
    }
  }

  async function submit() {
    setErr("");
    if (!form.referenceNumber || !form.units || !form.readingDate || !form.amount) {
      setErr("Please fill the required fields.");
      return;
    }
    setSubmitting(true);
    setStep(3);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          disco,
          referenceNumber: form.referenceNumber,
          units: Number(form.units),
          dateFrom: form.dateFrom || undefined,
          readingDate: form.readingDate,
          billMonth: form.billMonth || undefined,
          amount: Number(form.amount),
          tariff: form.tariff,
          readingType: form.readingType,
          fpa: Number(form.fpa || 0),
          pugCharge: Number(form.pugCharge || 0),
          historicalBills: historicalBills.length ? historicalBills : undefined,
        }),
      });
      if (!res.ok) throw new Error("Audit failed");
      const data = await res.json();
      await new Promise((r) => setTimeout(r, 1400));
      router.push(`/results/${data.billId}`);
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Nav />
      <main className="relative min-h-screen">
        <div className="absolute inset-0 bg-mesh-light" />
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="relative max-w-3xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #1B4332, #D4AF37)" }}
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="text-xs text-text-muted">Step {step} / 3</div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
                <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">Pick your DISCO</h1>
                <p className="text-text-muted mt-2">Choose the utility that sent you this bill.</p>
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {DISCO_LIST.map((d, i) => (
                    <motion.div key={d.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <TiltCard intensity={8}>
                        <button
                          onClick={() => { setDisco(d.id); setStep(2); }}
                          className="w-full text-left rounded-2xl bg-white border border-border p-4 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all tilt-card relative"
                        >
                          {d.id === "IESCO" && (
                            <span className="absolute top-2 right-2 text-[9px] uppercase tracking-widest rounded-full bg-accent text-primary px-2 py-0.5 font-bold">Auto-fetch</span>
                          )}
                          <div className="h-9 w-9 rounded-lg grid place-items-center" style={{ background: d.type === "gas" ? "rgba(245,158,11,0.12)" : "rgba(27,67,50,0.12)", color: d.type === "gas" ? "#B45309" : "#1B4332" }}>
                            {d.type === "gas" ? <Flame size={16} /> : <Zap size={16} />}
                          </div>
                          <div className="mt-3 font-bold text-primary">{d.name}</div>
                          <div className="text-xs text-text-muted mt-0.5">{d.region}</div>
                          <div className="text-[10px] uppercase tracking-widest mt-3 text-text-muted">{d.type}</div>
                        </button>
                      </TiltCard>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
                <button onClick={() => setStep(1)} className="text-sm text-text-muted hover:text-primary inline-flex items-center gap-1 mb-3">
                  <ArrowLeft size={16} /> Change DISCO
                </button>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl grid place-items-center text-white" style={{ background: isGas ? "#B45309" : "#1B4332" }}>
                    {isGas ? <Flame size={18} /> : <Zap size={18} />}
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-primary">{selected?.name}</h1>
                    <div className="text-xs text-text-muted">Type 6 details from your paper bill · 30 seconds</div>
                  </div>
                </div>

                {showAutoFetch && (
                  <div className="mt-6">
                    {canAutoFetch ? (
                      <AutoFetchCard userId={user?.id ?? "demo-user"} onFetchSuccess={onFetchSuccess} />
                    ) : (
                      <AutoFetchPaywall />
                    )}
                  </div>
                )}

                {fetchedAt && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-xl bg-primary/5 border border-primary/20 text-primary text-xs px-3 py-2 inline-flex items-center gap-2"
                  >
                    <CheckCircle2 size={14} /> Fetched from IESCO on {new Date(fetchedAt).toLocaleDateString("en-PK")} — review and confirm below.
                  </motion.div>
                )}

                <div className="mt-6 rounded-3xl glass p-6 md:p-8 space-y-5">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-bold text-primary">Manual entry</h2>
                    <span className="text-[11px] text-text-muted">Always available · fallback to auto-fetch</span>
                  </div>
                  <Field
                    label="Reference / Account Number"
                    urdu="اکاؤنٹ نمبر"
                    value={form.referenceNumber}
                    onChange={(v) => {
                      setForm({ ...form, referenceNumber: v });
                      // Typing a different ref invalidates the auto-filled dateFrom
                      if (dateFromAutoFilled) setDateFromAutoFilled(false);
                    }}
                    onBlur={onReferenceBlur}
                    placeholder="e.g. AB-123-456"
                  />
                  <Field label="Units Billed" urdu="یونٹس" value={form.units} onChange={(v) => setForm({ ...form, units: v })} placeholder="e.g. 325" type="number" help="Usually shown as 'Units' or 'kWh'" />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-baseline justify-between">
                        <label className="text-sm font-medium">Reading Date From (start of cycle)</label>
                        <span className="text-xs font-urdu text-text-muted">شروعاتی تاریخ</span>
                      </div>
                      <input
                        value={form.dateFrom}
                        onChange={(e) => {
                          setForm({ ...form, dateFrom: e.target.value });
                          if (dateFromAutoFilled) setDateFromAutoFilled(false);
                        }}
                        type="date"
                        className="input-ring mt-1 w-full rounded-xl border border-border bg-white/90 px-4 py-3 text-[15px] transition"
                      />
                      {dateFromAutoFilled ? (
                        <div className="text-xs text-primary-light mt-1 inline-flex items-center gap-1">
                          <CheckCircle2 size={12} /> Auto-filled from your last audit
                        </div>
                      ) : (
                        <div className="text-xs text-text-muted mt-1">
                          Optional. Check your previous month's bill — look for "READING DATE".
                          Leave blank if unavailable; we'll use your 12-month history instead.
                        </div>
                      )}
                    </div>
                    <Field label="Reading Date (end of cycle)" urdu="ریڈنگ کی تاریخ" value={form.readingDate} onChange={(v) => setForm({ ...form, readingDate: v })} type="date" help="The date printed on this bill" />
                  </div>
                  <Field label="Bill Month (optional)" urdu="بل کا مہینہ" value={form.billMonth} onChange={(v) => setForm({ ...form, billMonth: v })} placeholder="e.g. APR 26" help="Used for seasonal cross-check when Rule #1 falls back to Tier 1 inference" />
                  <Field label="Total Amount (PKR)" urdu="کل رقم" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} placeholder="e.g. 12500" type="number" help="Amount you are being asked to pay" />
                  <Select label="Tariff Category" urdu="ٹیرف" value={form.tariff} onChange={(v) => setForm({ ...form, tariff: v })} options={TARIFF_CATEGORIES.map((t) => ({ value: t.id, label: t.label }))} />
                  <div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-sm font-medium">Reading Type</div>
                      <div className="text-xs font-urdu text-text-muted">ریڈنگ کی قسم</div>
                    </div>
                    <div className="mt-2 grid gap-2">
                      {READING_TYPES.map((r) => (
                        <label key={r.id} className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${form.readingType === r.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"}`}>
                          <input type="radio" name="readingType" value={r.id} checked={form.readingType === r.id} onChange={() => setForm({ ...form, readingType: r.id })} className="mt-1 accent-primary" />
                          <div>
                            <div className="text-sm font-medium">{r.englishLabel}</div>
                            <div className="text-xs font-urdu text-text-muted">{r.urduLabel}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <details className="rounded-xl border border-border bg-white/70 p-4">
                    <summary className="cursor-pointer font-medium text-sm">Advanced fields (optional)</summary>
                    <div className="mt-4 space-y-3">
                      {!isGas && <Field label="Fuel Price Adjustment (PKR)" urdu="FPA" value={form.fpa} onChange={(v) => setForm({ ...form, fpa: v })} type="number" placeholder="0" />}
                      {isGas && <Field label="PUG Charge (PKR)" urdu="PUG چارج" value={form.pugCharge} onChange={(v) => setForm({ ...form, pugCharge: v })} type="number" placeholder="0" help="Passed Unregistered Gas charge" />}
                    </div>
                  </details>

                  {err && <div className="rounded-lg bg-danger/5 border border-danger/20 text-danger text-sm p-3">{err}</div>}

                  <MagneticButton
                    onClick={submit}
                    disabled={submitting}
                    className="w-full relative rounded-xl bg-primary text-white px-6 py-4 font-semibold hover:bg-primary-light disabled:opacity-60 inline-flex items-center justify-center gap-2 shadow-lg shadow-primary/20 overflow-hidden"
                  >
                    <span className="relative z-10">Run Audit</span>
                    <ChevronRight size={18} className="relative z-10" />
                    <span className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/40 to-accent/0 translate-x-[-120%]" />
                  </MagneticButton>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative h-24 w-24 grid place-items-center">
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                  <div className="absolute inset-2 rounded-full bg-primary/20" />
                  <Loader2 className="relative animate-spin text-primary" size={42} />
                </div>
                <div className="mt-6 font-bold text-primary text-xl">Checking NEPRA's 5 violation patterns…</div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-5 grid gap-2 text-xs text-text-muted max-w-md">
                  {[
                    "Rule 1 · Extended billing cycle",
                    "Rule 2 · Slab threshold abuse",
                    "Rule 3 · FPA on lifeline",
                    "Rule 4 · Chained estimates",
                    "Rule 5 · PUG charges",
                  ].map((r, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.12 }} className="rounded-lg bg-white/70 border border-border px-3 py-2 text-left">
                      {r}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Field({ label, urdu, value, onChange, onBlur, placeholder, type = "text", help }: { label: string; urdu?: string; value: string; onChange: (v: string) => void; onBlur?: () => void; placeholder?: string; type?: string; help?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium">{label}</label>
        {urdu && <span className="text-xs font-urdu text-text-muted">{urdu}</span>}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        type={type}
        placeholder={placeholder}
        className="input-ring mt-1 w-full rounded-xl border border-border bg-white/90 px-4 py-3 text-[15px] transition"
      />
      {help && <div className="text-xs text-text-muted mt-1">{help}</div>}
    </div>
  );
}

function Select({ label, urdu, value, onChange, options }: { label: string; urdu?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium">{label}</label>
        {urdu && <span className="text-xs font-urdu text-text-muted">{urdu}</span>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-ring mt-1 w-full rounded-xl border border-border bg-white/90 px-4 py-3 text-[15px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
