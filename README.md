# Haqdar — Pakistan's Refund Button

> **حقدار** (Urdu: *rightful owner*). A web app that catches overcharges in Pakistani electricity and gas bills, then writes a ready-to-file NEPRA complaint — bilingual, in 30 seconds.

Built for **Micathon'26** (Microsoft Club, GIKI).

---

## The problem, in one number

**Rs 3.572 billion** was overcharged to **3,080,186** consumers in six months in FY24 — using patterns NEPRA's own inquiry documented. Most consumers don't know they were overcharged, and even fewer know how to file.

## What Haqdar does

1. You type 6 fields from your bill (or for IESCO, we auto-fetch them).
2. We run **5 deterministic rules** based on NEPRA's 2024 findings.
3. Every violation cites an exact SRO — no AI, no hallucinations.
4. We generate a bilingual (English + Urdu) complaint PDF.
5. You file it via the **NEPRA web portal** or the **Asaan Approach mobile app**.
6. NEPRA has 15 working days to order a refund. We track the clock.

---

## The 5 detection rules

| # | Rule | Confidence | What it catches |
|---|---|---|---|
| 1 | **Extended Billing Cycle** | high / medium | Bill covers > 30 days, pushing you into a higher slab |
| 2 | Suspicious Slab Threshold | medium | Units sit suspiciously just above a slab boundary |
| 3 | FPA on Lifeline | high | Fuel Price Adjustment charged to a lifeline consumer (illegal) |
| 4 | Chained Estimated Readings | medium | 3+ bills in a row with no physical meter reading |
| 5 | PUG Charge | high | Unexplained "Passed Unregistered Gas" charge on SNGPL / SSGC |

Rule #1 is **tiered**:

- **Tier 3** (HIGH) — both cycle dates on the bill → measure exactly
- **Tier 2** (HIGH) — prior audit in DB → measure exactly from that
- **Tier 1** (MEDIUM) — 12-month history on the bill → trimmed-mean + seasonal cross-check
- **Skipped** — first audit, no data → friendly notice, "cycle analysis activates next month"

---

## Flagship: live IESCO auto-fetch (Pro only)

Paste a 14-digit reference number → we scrape the official PITC portal and pre-fill the whole form. 12 months of history come along, which feeds Tier 1 inference.

- **Pro / Business tier** → sees the auto-fetch card
- **Free tier** → sees the paywall; manual entry always works

Gate enforced in **two places** — the UI conditional render and a server-side check inside `/api/fetchBill` (returns HTTP 403 `SUBSCRIPTION_REQUIRED` for anyone without an active paid tier, even if they curl the endpoint directly).

---

## Pricing

| Plan | Price | What you get |
|---|---|---|
| **Free Trial** | Rs 0 / 14 days | Manual bill audits, PDF complaints |
| **Pro** | **Rs 60 / month** | Unlimited audits, priority filing, live IESCO auto-fetch, refund tracking |
| **Business** | **Rs 120 / meter / month** | Everything in Pro, multi-meter dashboards, bulk CSV upload |

*Demo tier toggle* in the top nav lets judges switch instantly between Free / Pro / Business to see both the paywall and the live auto-fetch.

---

## Filing a complaint

After a violation is detected, Haqdar generates a **bilingual PDF** and offers two filing channels:

1. **NEPRA Web Portal** → `https://nepra.org.pk/CAD-Database/CMS-CAD/cregister.php`
2. **NEPRA Asaan Approach** (mobile app) → Play Store / App Store links

A **pre-flight checklist modal** reminds the user to first file with IESCO (dial `118` / SMS `8118`) and get a tracking number, which NEPRA requires. Both channels:

- Copy the complaint text to clipboard
- Mark the complaint as `filed` in the store
- Start the 15-day statutory clock (shown on the dashboard)

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript** (strict) + **Tailwind CSS**
- **framer-motion** for page transitions, 3D card tilts, count-up numbers
- **@react-pdf/renderer** for the bilingual complaint PDF (Noto Nastaliq Urdu)
- **cheerio** for HTML parsing in the IESCO scraper
- **recharts** for the impact dashboard
- **In-memory Map-backed store** seeded with demo data (swap for Supabase in production — shape mirrors the schema in the original brief)

No AI, no blockchain, no payment gateway. Rule-based, deterministic, auditable.

---

## Running locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

Build for production:

```bash
npm run build
npm run start
```

Node 18+ works; Node 20+ is smoother. Scraper has a polyfill for Node 18's missing `File` global.

---

## Project structure

```
app/
  page.tsx                   — landing page (3D hero, pricing, trust, CTA)
  scan/                      — bill entry: DISCO picker + auto-fetch + manual form
  results/[billId]/          — violation cards with confidence badges + bilingual tabs
  complaint/[complaintId]/   — finalize details → PDF preview → file via web or app
  dashboard/                 — user's bills, complaints, refund timeline
  impact/                    — public impact dashboard (for the pitch)
  pricing/                   — tier cards + demo tier switcher
  api/
    audit                    — run 5 rules, persist bill + overcharges + notices
    fetchBill                — gated IESCO scraper with 24h cache
    bill/[id]                — GET a stored audit + its notices
    bills/previous           — prefill dateFrom from user's last audit
    complaint/generate|file|pdf|get — build, file, stream, load a complaint
    dashboard                — stats + bills + complaints for the user
    impact                   — public impact counters + live feed
    user, user/tier          — demo tier switcher endpoints

components/
  Nav.tsx, Footer.tsx        — glass nav with tier pill, gradient footer
  AutoFetchCard.tsx          — Pro feature: IESCO live-fetch UI
  AutoFetchPaywall.tsx       — Free tier paywall variant
  ComplaintPDF.tsx           — react-pdf bilingual document
  complaint/
    ChecklistModal.tsx       — IESCO-first pre-flight gate
    AsaanAppCard.tsx         — mobile app install + paste instructions
  hero/                      — 3D tilting bill card stack + live ticker
  motion/                    — ScrollReveal, TiltCard, MagneticButton,
                                AnimatedNumber, SplitText, Orb, PageTransition

lib/
  slabs.ts                   — FY2024-25 tariff slabs + DISCO/tariff/reading enums
  slabCalculator.ts          — slab-based bill re-computation
  store.ts                   — in-memory DB (Map-backed)
  subscription.ts            — canUseAutoFetch gate helper
  complaintTemplates.ts      — bilingual complaint body templates
  scrapers/
    iesco.ts                 — IESCO scraper (GET + ASP.NET postback fallback,
                                header-label date parsing + regex fallback)
    index.ts                 — scraper registry + SUPPORTED_DISCOS
    _polyfill.ts             — Node 18 File/FormData/Blob stubs for undici
  detection/
    index.ts                 — tiered orchestrator → { overcharges, notices }
    extendedCycle.ts         — Rule #1 (Tier 3 from-dates, Tier 2 exact, Tier 1 inferred)
    dateResolver.ts          — user/history/estimated date resolution with provenance
    rule2_slab_abuse.ts      — Rule #2 slab threshold
    rule3_fpa_lifeline.ts    — Rule #3 FPA on lifeline
    rule4_chained_estimates.ts — Rule #4 chained estimates
    rule5_pug_charges.ts     — Rule #5 PUG charges

types/index.ts               — Bill, OverchargeResult, AuditNotice, Complaint, etc.
```

---

## Demo script (for the judges)

1. **Open `/` homepage.** Scroll through the 3D hero, stats, pricing.
2. **Top nav → tier pill** reads `PRO`. Click → preview `FREE` paywall later.
3. Back to `PRO`. Click **Check Bill** → pick **IESCO**.
4. In the auto-fetch card, paste `03 14217 0793600 U` → click **Auto-fetch bill**. ~3 seconds. Form pre-fills.
5. Click **Run Audit** → see violation cards with confidence badges.
6. Click **Generate Complaint Letter** → `/complaint/...`
7. Enter your name + CNIC. See the bilingual preview update live. Click **Download PDF**.
8. Click **Open NEPRA Web Portal**. The pre-flight checklist appears — tick both boxes → **Proceed**. NEPRA's portal opens in a new tab; complaint text is on the clipboard ready to paste.
9. Back to `/dashboard` — bill, complaint, 15-day refund clock all showing.
10. Switch tier to `FREE`. Go back to `/scan` → the auto-fetch card is replaced by the paywall.

---

## What's not built (honest)
- **Real payments** — subscription UI is marketing-only.
- **Authentication** — single demo user.
- **Fully automated NEPRA submission** — NEPRA's portal requires CAPTCHA + OTP, so we copy the text + open the portal. Honest and defensible for the pitch.

---

## Credits

Built for **Micathon'26** at **Ghulam Ishaq Khan Institute (GIKI)**, theme *"Money Moves"*.

Every detection rule maps to a specific NEPRA SRO. Every number on the landing page comes from NEPRA's public FY24 State of Industry Report. **We don't guess. We don't use AI. We cite law.**
