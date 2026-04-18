"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import MagneticButton from "@/components/motion/MagneticButton";
import ChecklistModal, { type FilingChannel } from "@/components/complaint/ChecklistModal";
import AsaanAppCard from "@/components/complaint/AsaanAppCard";
import { fmtPKR } from "@/lib/utils";
import { Copy, ExternalLink, FileDown, CheckCircle2, Clock, ShieldCheck, Globe, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Complaint, OverchargeResult, Bill } from "@/types";

const NEPRA_WEB_PORTAL = "https://nepra.org.pk/CAD-Database/CMS-CAD/cregister.php";

export default function ComplaintPage() {
  const params = useParams<{ complaintId: string }>();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [overcharges, setOvercharges] = useState<OverchargeResult[]>([]);
  const [bill, setBill] = useState<Bill | null>(null);
  const [form, setForm] = useState({
    name: "",
    cnic: "",
    mobile: "",
    email: "",
    address: "",
    language: "both" as "english" | "urdu" | "both",
  });
  const [copied, setCopied] = useState(false);
  const [filed, setFiled] = useState(false);
  const [filedChannel, setFiledChannel] = useState<FilingChannel | null>(null);
  const [filedAt, setFiledAt] = useState<string | null>(null);

  const [showChecklist, setShowChecklist] = useState(false);
  const [pendingChannel, setPendingChannel] = useState<FilingChannel | null>(null);

  useEffect(() => {
    fetch(`/api/complaint/get?id=${params.complaintId}`).then((r) => r.json()).then((d) => {
      setComplaint(d.complaint);
      setOvercharges(d.overcharges ?? []);
      setBill(d.bill);
      setForm((f) => ({
        ...f,
        name: d.complaint?.consumer_name ?? "",
        cnic: d.complaint?.cnic ?? "",
        mobile: d.complaint?.mobile ?? "",
        email: d.complaint?.email ?? "",
        address: d.complaint?.address ?? "",
        language: d.complaint?.language ?? "both",
      }));
      setFiled(d.complaint?.status === "filed");
      setFiledAt(d.complaint?.filed_at ?? null);
    });
  }, [params.complaintId]);

  async function finalize() {
    if (!bill) return;
    const res = await fetch("/api/complaint/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        billId: bill.id,
        consumerName: form.name,
        cnic: form.cnic,
        mobile: form.mobile,
        email: form.email,
        address: form.address,
        language: form.language,
      }),
    });
    if (!res.ok) return;
    const { complaintId } = await res.json();
    router.replace(`/complaint/${complaintId}`);
  }

  function initiateFile(channel: FilingChannel) {
    setPendingChannel(channel);
    setShowChecklist(true);
  }

  async function proceedFile() {
    if (!complaint || !pendingChannel) return;
    const channel = pendingChannel;
    setShowChecklist(false);
    setPendingChannel(null);

    const text = form.language === "urdu" ? complaint.complaint_text_urdu : complaint.complaint_text_english;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // browser blocked clipboard — the text is still visible in the preview
    }

    try {
      await fetch("/api/complaint/file", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ complaintId: complaint.id }),
      });
    } catch {}
    setFiled(true);
    setFiledChannel(channel);
    setFiledAt(new Date().toISOString());

    if (channel === "web") {
      window.open(NEPRA_WEB_PORTAL, "_blank", "noopener,noreferrer");
    }
    // For "app", the AsaanAppCard appears inline with install + usage instructions.
  }

  if (!complaint || !bill) {
    return (
      <>
        <Nav />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center text-text-muted">Loading complaint…</main>
        <Footer />
      </>
    );
  }

  const activeText = form.language === "urdu" ? complaint.complaint_text_urdu : complaint.complaint_text_english;

  return (
    <>
      <Nav />
      <main className="relative">
        <div className="absolute inset-0 bg-mesh-light pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 py-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary-light">
              <ShieldCheck size={14} /> Formal complaint · {complaint.regulator}
            </div>
            <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
              Refund claim: <span className="text-danger">{fmtPKR(complaint.total_refund_claimed)}</span>
            </h1>
            <div className="mt-1 text-sm text-text-muted">
              {overcharges.length} violations · bill ref {bill.reference_number}
            </div>
          </motion.div>

          <div className="mt-8 grid lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl bg-white border border-border p-6 md:p-8 shadow-sm"
            >
              <h2 className="font-bold text-primary text-lg">Your details</h2>
              <p className="text-xs text-text-muted">NEPRA requires these on every complaint.</p>
              <div className="mt-5 space-y-4">
                <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <Field label="CNIC (XXXXX-XXXXXXX-X)" value={form.cnic} onChange={(v) => setForm({ ...form, cnic: v })} />
                <Field label="Mobile Number" value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} />
                <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
                <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
                <div>
                  <label className="text-sm font-medium">Language preference</label>
                  <div className="mt-2 flex gap-2 text-sm">
                    {(["english", "urdu", "both"] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => setForm({ ...form, language: l })}
                        className={`px-4 py-2 rounded-xl border transition-all ${
                          form.language === l
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-white border-border hover:border-primary/40"
                        }`}
                      >
                        {l === "english" ? "English" : l === "urdu" ? "اردو" : "Both"}
                      </button>
                    ))}
                  </div>
                </div>
                <MagneticButton
                  onClick={finalize}
                  className="w-full mt-3 bg-primary text-white px-4 py-3 rounded-xl font-semibold hover:bg-primary-light shadow-lg shadow-primary/20"
                >
                  Finalize complaint
                </MagneticButton>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-3xl bg-white border border-border p-6 md:p-8 flex flex-col shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-primary text-lg">Live preview</h2>
                <a
                  href={`/api/complaint/pdf?id=${complaint.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <FileDown size={16} /> Download PDF
                </a>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={form.language}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`mt-3 flex-1 rounded-2xl bg-bg p-4 overflow-auto max-h-[420px] text-xs whitespace-pre-wrap leading-relaxed border border-border ${
                    form.language === "urdu" ? "font-urdu text-right" : ""
                  }`}
                >
                  {activeText}
                </motion.div>
              </AnimatePresence>

              <div className="mt-5 rounded-2xl bg-accent/10 border border-accent/30 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary-light font-semibold">
                  <Clock size={13} /> Choose your filing channel
                </div>
                <p className="mt-1 text-sm text-text-main">
                  Your complaint has been generated. NEPRA mandates a <strong>15-day resolution timeline</strong>.
                </p>
                <div className="mt-4 grid sm:grid-cols-2 gap-2">
                  <MagneticButton
                    onClick={() => initiateFile("web")}
                    className="rounded-xl bg-primary text-white font-semibold px-4 py-3 hover:bg-primary-light inline-flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <Globe size={16} /> Open NEPRA Web Portal
                  </MagneticButton>
                  <MagneticButton
                    onClick={() => initiateFile("app")}
                    className="rounded-xl bg-accent text-primary font-bold px-4 py-3 hover:brightness-105 inline-flex items-center justify-center gap-2 shadow-lg shadow-accent/30"
                  >
                    <Smartphone size={16} /> Use Asaan Approach App
                  </MagneticButton>
                </div>
                {copied && (
                  <div className="mt-3 text-xs text-primary-light inline-flex items-center gap-1 justify-center w-full">
                    <Copy size={12} /> Complaint text copied to clipboard — paste it into the form.
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {filed && filedChannel === "app" && <AsaanAppCard />}

          {filed && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 relative overflow-hidden rounded-3xl p-6 text-white"
            >
              <div className="absolute inset-0 bg-mesh" />
              <div className="absolute inset-0 bg-noise opacity-60" />
              <div className="relative flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-accent text-primary grid place-items-center">
                  <CheckCircle2 />
                </div>
                <div>
                  <div className="font-bold">
                    Complaint marked as filed
                    {filedChannel === "web" && <> via NEPRA Web Portal</>}
                    {filedChannel === "app" && <> via NEPRA Asaan Approach App</>}
                  </div>
                  <div className="text-white/80 text-sm mt-1">
                    NEPRA has 15 working days to respond. We'll track this in your dashboard.
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 text-accent">
                      <Clock size={16} /> Statutory clock started:{" "}
                      {new Date(filedAt ?? Date.now()).toLocaleDateString("en-PK")}
                    </span>
                    {filedChannel === "web" && (
                      <a
                        href={NEPRA_WEB_PORTAL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs rounded-full bg-white/10 border border-white/20 px-3 py-1 hover:bg-white/20"
                      >
                        Re-open portal <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <ChecklistModal
        open={showChecklist}
        channel={pendingChannel}
        onCancel={() => {
          setShowChecklist(false);
          setPendingChannel(null);
        }}
        onProceed={proceedFile}
      />

      <Footer />
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        className="input-ring mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-[15px]"
      />
    </div>
  );
}
