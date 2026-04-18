# Haqdar — Pakistan's Refund Button

FinTech web app for Micathon'26 that detects overcharges in Pakistani utility bills
using NEPRA's documented 2024 violation patterns, then generates bilingual complaint
PDFs and guides users to file them via NEPRA's portal.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind
- @react-pdf/renderer for bilingual (English + Urdu) complaints
- Recharts for the impact dashboard
- In-memory store (seeded demo data) — swap for Supabase in production

## Run locally
```bash
npm install
npm run dev
# open http://localhost:3000
```

## Build
```bash
npm run build
npm run start
```

## Architecture
- `lib/slabs.ts` — FY2024-25 slab rates + DISCO list + tariff/reading enums
- `lib/slabCalculator.ts` — slab-based bill recalculation
- `lib/detection/` — the 5 deterministic NEPRA rules (core IP)
- `lib/complaintTemplates.ts` — bilingual complaint letter templates
- `lib/store.ts` — in-memory DB (Maps) with seeded impact stats
- `components/ComplaintPDF.tsx` — react-pdf document
- `app/api/*` — audit, complaint generate/file/pdf/get, impact, dashboard, bill
- `app/*` — homepage, /scan, /results/[id], /complaint/[id], /dashboard, /impact

## Demo flow
1. Landing → **Check Your Bill**
2. `/scan` → pick DISCO → type 6 fields → Run Audit
3. `/results/[billId]` → see violations with SRO citations + bilingual explanations
4. Generate Complaint Letter → `/complaint/[id]` → finalize details → Download PDF → File with NEPRA
5. `/dashboard` — track every bill, complaint, and refund
6. `/impact` — public impact dashboard (for the pitch)

## Not built (out of scope for MVP)
- Real Supabase integration (in-memory store used instead; the store module has the same shape)
- Real payment processing (subscription UI is marketing-only)
- Auth (single demo user)
- Real auto-submit to NEPRA portal (requires CAPTCHA + OTP — we copy text + open portal)
