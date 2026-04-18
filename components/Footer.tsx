import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden">
      <div className="absolute inset-0 bg-mesh" />
      <div className="absolute inset-0 bg-noise opacity-60" />
      <div className="relative max-w-6xl mx-auto px-4 py-14 grid md:grid-cols-4 gap-8 text-sm text-white/80">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent text-primary grid place-items-center font-black">H</div>
            <div className="text-white font-bold text-lg">Haqdar <span className="font-urdu text-accent/80">حقدار</span></div>
          </div>
          <p className="mt-3 max-w-md">
            Pakistan's consumer bill audit platform. Built on NEPRA's own 2024 inquiry findings. Every violation flag cites a specific NEPRA SRO.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs rounded-full border border-white/15 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            We don't guess. We don't use AI. We cite law.
          </div>
        </div>
        <div>
          <div className="font-semibold text-white">Product</div>
          <ul className="mt-3 space-y-2">
            <li><Link href="/scan" className="hover:text-white">Check Your Bill</Link></li>
            <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
            <li><Link href="/impact" className="hover:text-white">Impact</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-white">Built for</div>
          <div className="mt-3">Micathon'26 · GIKI</div>
          <div className="text-xs text-white/60">Microsoft Club, Ghulam Ishaq Khan Institute</div>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Haqdar — Pakistan's Refund Button
        </div>
      </div>
    </footer>
  );
}
