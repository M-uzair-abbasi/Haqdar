import { Bill, OverchargeResult, AuditNotice } from "@/types";
import {
  detectExtendedCycleFromDates,
  detectExtendedCycleExact,
  detectExtendedCycleFromHistory,
} from "./extendedCycle";
import { detectSlabAbuse } from "./rule2_slab_abuse";
import { detectFPAOnLifeline } from "./rule3_fpa_lifeline";
import { detectChainedEstimates } from "./rule4_chained_estimates";
import { detectPUGCharges } from "./rule5_pug_charges";

export interface DetectionContext {
  previousBill?: Bill | null;
}

export interface DetectionResult {
  overcharges: OverchargeResult[];
  notices: AuditNotice[];
}

export function runAllDetections(bill: Bill, ctx: DetectionContext = {}): DetectionResult {
  const overcharges: OverchargeResult[] = [];
  const notices: AuditNotice[] = [];

  // Rule #1 — tiered extended cycle detection:
  //   TIER 3 (HIGH)   : direct dates on the bill (reading_date_from + reading_date)
  //   TIER 2 (HIGH)   : no from-date, but stored previous bill exists for same ref+user
  //   TIER 1 (MEDIUM) : no from-date, no prev bill, but historical_bills length >= 6
  //   NONE            : insufficient data — skip silently and emit a UI notice
  let rule1Fired = false;
  // Tier 3 requires a *genuine* cycle — if reading_date_from collapses to
  // reading_date (sentinel for "no start date provided"), fall through.
  const hasGenuineDateRange =
    !!bill.reading_date_from &&
    !!bill.reading_date &&
    bill.reading_date_from !== bill.reading_date;
  if (hasGenuineDateRange) {
    const fromDates = detectExtendedCycleFromDates(bill);
    if (fromDates) overcharges.push(fromDates);
    rule1Fired = true;
  } else if (ctx.previousBill) {
    const exact = detectExtendedCycleExact(bill, ctx.previousBill);
    if (exact) overcharges.push(exact);
    rule1Fired = true;
  } else if (bill.historical_bills && bill.historical_bills.length >= 6) {
    const inferred = detectExtendedCycleFromHistory(bill, bill.historical_bills);
    if (inferred) overcharges.push(inferred);
    rule1Fired = true;
  }

  if (!rule1Fired) {
    notices.push({
      code: "EXTENDED_CYCLE_SKIPPED_NO_HISTORY",
      title_english: "First audit — cycle analysis activates next month",
      title_urdu: "پہلا آڈٹ — سائیکل تجزیہ اگلے مہینے فعال ہو جائے گا",
      body_english:
        "Cycle length can only be measured when we have (a) both cycle dates on this bill, (b) a previous bill from you on the same connection, or (c) 6+ months of consumption history. Fill in 'Reading Date From' from your previous bill to enable exact detection now, otherwise Rule #1 will run automatically on your next audit.",
      body_urdu:
        "سائیکل کی لمبائی اسی وقت ناپی جا سکتی ہے جب (الف) اس بل پر دونوں سائیکل کی تاریخیں موجود ہوں، (ب) اسی کنکشن کا پچھلا بل ہمارے پاس ہو، یا (ج) 6 ماہ یا زیادہ کی کھپت کی تاریخ موجود ہو۔ پچھلے بل سے 'Reading Date From' پُر کریں تاکہ ابھی درست تجزیہ ہو، ورنہ اگلے آڈٹ میں یہ رول خودکار چلے گا۔",
    });
  }

  // Rules #2-#5 — always run (single-bill rules)
  const singleBillRules = [
    detectSlabAbuse,
    detectFPAOnLifeline,
    detectChainedEstimates,
    detectPUGCharges,
  ];
  for (const rule of singleBillRules) {
    const r = rule(bill);
    if (r) overcharges.push(r);
  }

  return { overcharges, notices };
}

export function getTotalOvercharge(results: OverchargeResult[]): number {
  return results.reduce((sum, r) => sum + r.overcharge_amount, 0);
}
