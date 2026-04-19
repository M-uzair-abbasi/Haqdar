"use client";
import { Zap, Check, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function AutoFetchPaywall() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-6 md:p-7 bg-white border-2 border-dashed border-accent/60 shadow-sm"
    >
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
      <div className="relative flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-accent/20 text-accent grid place-items-center">
          <Lock size={16} />
        </div>
        <div>
          <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-accent font-bold">
            <Sparkles size={10} /> Pro feature
          </div>
          <h3 className="font-bold text-lg leading-tight text-primary">Auto-fetch your bill</h3>
        </div>
      </div>
      <p className="relative text-sm text-text-muted mt-3">
        Skip manual entry. Pro users type only their reference number — we fetch the full bill in 3 seconds.
      </p>

      <ul className="relative text-sm space-y-2 mt-5">
        <li className="flex gap-2"><Check className="text-primary-light mt-0.5" size={16} /> Live auto-fetch for IESCO (6M+ consumers)</li>
        <li className="flex gap-2"><Check className="text-primary-light mt-0.5" size={16} /> LESCO, MEPCO, GEPCO & more coming soon</li>
        <li className="flex gap-2"><Check className="text-primary-light mt-0.5" size={16} /> Unlimited overcharge audits</li>
        <li className="flex gap-2"><Check className="text-primary-light mt-0.5" size={16} /> 14-day free trial, cancel anytime</li>
      </ul>

      <div className="relative mt-6 flex flex-col sm:flex-row gap-2">
        <Link
          href="/pricing"
          className="flex-1 text-center rounded-xl bg-primary text-white px-4 py-3 font-bold hover:bg-primary-light inline-flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          <Zap size={16} /> Upgrade to Pro — Rs 60/month
        </Link>
        <Link
          href="/#pricing"
          className="rounded-xl border border-border bg-white px-4 py-3 font-medium text-text-main hover:bg-bg text-center"
        >
          Compare plans
        </Link>
      </div>

      <div className="relative mt-4 text-[11px] text-text-muted">
        Manual entry remains available below — always free.
      </div>
    </motion.div>
  );
}
