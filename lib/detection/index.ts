import { Bill, OverchargeResult, AuditNotice } from "@/types";
import { detectExtendedCycleExact, detectExtendedCycleFromHistory } from "./extendedCycle";
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
  //   HIGH   : exact previous-bill comparison (reading_date delta)
  //   MEDIUM : inferred from 6+ months of consumption history
  //   skipped: first audit, no stored prev bill, no embedded history -> emit notice
  if (ctx.previousBill) {
    const exact = detectExtendedCycleExact(bill, ctx.previousBill);
    if (exact) overcharges.push(exact);
  } else if (bill.historical_bills && bill.historical_bills.length >= 6) {
    const inferred = detectExtendedCycleFromHistory(bill, bill.historical_bills);
    if (inferred) overcharges.push(inferred);
  } else {
    notices.push({
      code: "EXTENDED_CYCLE_SKIPPED_NO_HISTORY",
      title_english: "First audit — cycle analysis activates next month",
      title_urdu: "پہلا آڈٹ — سائیکل تجزیہ اگلے مہینے فعال ہو جائے گا",
      body_english:
        "Real electricity bills don't print a cycle start date, so cycle length can only be measured once we have either (a) a previous bill from you on the same connection, or (b) 6+ months of consumption history from the bill (IESCO auto-fetch provides this). We'll run Rule #1 automatically on your next audit.",
      body_urdu:
        "اصلی بلوں پر سائیکل کی شروعاتی تاریخ نہیں ہوتی۔ سائیکل کی لمبائی ناپنے کے لیے یا تو (الف) اسی کنکشن کا پچھلا بل چاہیے یا (ب) بل میں 6 ماہ یا زیادہ کی کھپت کی تاریخ (IESCO آٹو فیچ سے ملتی ہے)۔ اگلے آڈٹ میں یہ رول خودکار چلے گا۔",
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
