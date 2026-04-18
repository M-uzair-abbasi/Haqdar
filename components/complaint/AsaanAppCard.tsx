"use client";
import { motion } from "framer-motion";
import { Smartphone, CheckCircle2 } from "lucide-react";

const PLAY_STORE_URL = "https://play.google.com/store/search?q=NEPRA+Asaan+Approach&c=apps";
const APP_STORE_URL = "https://apps.apple.com/search?term=NEPRA%20Asaan%20Approach";

export default function AsaanAppCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 relative overflow-hidden rounded-3xl p-6 text-white"
      style={{ background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 55%, #1B4332 100%)" }}
    >
      <div className="absolute inset-0 bg-noise opacity-40" />
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-accent/25 blur-3xl" />

      <div className="relative flex items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-accent text-primary grid place-items-center shrink-0">
          <Smartphone size={20} />
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-widest text-accent font-semibold">Mobile filing</div>
          <h3 className="mt-1 font-bold text-lg">NEPRA Asaan Approach app</h3>
          <p className="mt-1 text-sm text-white/80">
            The complaint text is copied to your clipboard. Install the official NEPRA app,
            tap <strong>New Complaint</strong>, and paste in the description field.
          </p>

          <ol className="mt-4 space-y-1.5 text-[13px] text-white/85 list-decimal list-inside">
            <li>Install the app (links below)</li>
            <li>Open → <em>New Complaint</em></li>
            <li>Paste the clipboard text into the description field</li>
            <li>Submit with your mobile OTP</li>
          </ol>

          <div className="mt-5 grid sm:grid-cols-2 gap-2">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white text-primary font-semibold px-4 py-2.5 text-center hover:brightness-105 inline-flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5V3.5a1 1 0 01.51-.87l11 8.5a.5.5 0 010 .74l-11 8.5A1 1 0 013 20.5z"/></svg>
              Google Play
            </a>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-accent text-primary font-semibold px-4 py-2.5 text-center hover:brightness-105 inline-flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12.5c0-3.3 2.7-4.8 2.8-4.9-1.5-2.2-3.9-2.5-4.7-2.5-2-.2-3.9 1.2-4.9 1.2-1 0-2.6-1.2-4.3-1.1C4 5.3 2 7 1 9.3c-2 3.5-.5 8.7 1.4 11.6 1 1.4 2.1 3 3.6 2.9 1.4 0 2-.9 3.8-.9s2.3.9 3.8.9c1.6 0 2.6-1.4 3.6-2.8 1.1-1.6 1.6-3.1 1.6-3.2-.1 0-3.1-1.2-3.1-4.6z"/></svg>
              App Store
            </a>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[11px] text-white/60">
            <CheckCircle2 size={12} className="text-accent" />
            Clipboard is active for 2 minutes — paste before it clears
          </div>
        </div>
      </div>
    </motion.div>
  );
}
