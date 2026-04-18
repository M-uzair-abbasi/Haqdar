"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Phone, MessageSquare, X, Info, ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";

export type FilingChannel = "web" | "app";

interface Props {
  open: boolean;
  channel: FilingChannel | null;
  onCancel: () => void;
  onProceed: () => void;
}

export default function ChecklistModal({ open, channel, onCancel, onProceed }: Props) {
  const [filed, setFiled] = useState(false);
  const [tracking, setTracking] = useState(false);

  // Reset whenever the modal closes so next open starts clean.
  function close() {
    setFiled(false);
    setTracking(false);
    onCancel();
  }

  async function proceed() {
    setFiled(false);
    setTracking(false);
    onProceed();
  }

  const channelLabel =
    channel === "web" ? "NEPRA Web Portal" : channel === "app" ? "NEPRA Asaan Approach App" : "NEPRA";

  const ready = filed && tracking;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-3xl bg-white border border-border shadow-2xl p-6 md:p-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checklist-title"
          >
            <button
              onClick={close}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg hover:bg-bg text-text-muted grid place-items-center"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary-light">
              <ShieldCheck size={13} /> Pre-flight checklist
            </div>
            <h2 id="checklist-title" className="mt-1 text-xl md:text-2xl font-extrabold text-primary">
              Before you file with NEPRA
            </h2>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">
              NEPRA asks consumers to first file with their DISCO. Complaints that skip DISCO-level
              resolution are often rejected or bounced back.
            </p>

            <div className="mt-5 space-y-3">
              <CheckRow
                checked={filed}
                onToggle={() => setFiled((v) => !v)}
                title="I've filed a complaint with IESCO's customer service"
                body={
                  <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-text-muted">
                    <span className="inline-flex items-center gap-1"><Phone size={12} /> Dial <strong>118</strong></span>
                    <span className="inline-flex items-center gap-1"><MessageSquare size={12} /> SMS to <strong>8118</strong></span>
                  </span>
                }
              />
              <CheckRow
                checked={tracking}
                onToggle={() => setTracking((v) => !v)}
                title="I have a complaint tracking / reference number from IESCO"
                body="Write this number in the NEPRA complaint form when prompted."
              />
            </div>

            <div className="mt-6 rounded-xl bg-accent/10 border border-accent/30 p-3 flex items-start gap-2 text-xs text-text-main">
              <Info size={14} className="text-accent mt-0.5 shrink-0" />
              <span>
                If you don't have a tracking number yet, we recommend calling IESCO first.
                NEPRA may reject your complaint otherwise.
              </span>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
              <button
                onClick={close}
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium hover:bg-bg"
              >
                Not yet — I'll call IESCO first
              </button>
              <button
                onClick={proceed}
                disabled={!ready}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 ${
                  ready
                    ? "bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/20"
                    : "bg-border text-text-muted cursor-not-allowed"
                }`}
              >
                Proceed to {channelLabel} <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CheckRow({
  checked,
  onToggle,
  title,
  body,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left flex items-start gap-3 rounded-2xl border p-4 transition ${
        checked ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/40"
      }`}
    >
      <div
        className={`mt-0.5 h-5 w-5 rounded-md grid place-items-center border-2 transition ${
          checked ? "bg-primary border-primary text-white" : "bg-white border-border"
        }`}
      >
        {checked && <CheckCircle2 size={14} />}
      </div>
      <div className="flex-1 text-sm">
        <div className="font-semibold text-primary">{title}</div>
        <div className="mt-1 text-xs text-text-muted leading-relaxed">{body}</div>
      </div>
    </button>
  );
}
