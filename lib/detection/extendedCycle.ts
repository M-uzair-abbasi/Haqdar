import { Bill, OverchargeResult, HistoricalBillEntry } from "@/types";
import { calculateSlabAmount } from "../slabCalculator";

function daysBetweenISO(fromISO: string, toISO: string): number {
  const from = new Date(fromISO).getTime();
  const to = new Date(toISO).getTime();
  if (!isFinite(from) || !isFinite(to)) return 0;
  return Math.max(0, Math.round((to - from) / (1000 * 60 * 60 * 24)));
}

// ────────────────────────────────────────────────────────────
// 0) FROM DATES — HIGH confidence (Tier 3). The user (or auto-fill)
//    supplied both cycle endpoints on the bill itself. Direct path
//    that fires on the very first audit.
// ────────────────────────────────────────────────────────────
export function detectExtendedCycleFromDates(bill: Bill): OverchargeResult | null {
  if (!bill.reading_date_from || !bill.reading_date) return null;
  const cycleDays = daysBetweenISO(bill.reading_date_from, bill.reading_date);
  if (cycleDays <= 31) return null;

  const expectedUnitsIn30Days = (bill.units_billed * 30) / cycleDays;
  const recalculatedAmount = calculateSlabAmount(
    expectedUnitsIn30Days,
    bill.tariff_category,
    bill.disco_name
  );
  const overcharge = bill.total_amount - recalculatedAmount;
  if (overcharge <= 100) return null;

  return {
    pattern_code: "EXTENDED_CYCLE_FROM_DATES",
    pattern_name: "Extended Billing Cycle",
    sro_citation: "NEPRA Act Section 26(1) & SRO 1142(I)/2020",
    overcharge_amount: Math.round(overcharge),
    explanation_english:
      `Cycle dates on this bill: ${bill.reading_date_from} → ${bill.reading_date} (${cycleDays} days). ` +
      `The standard cycle is 30 days. Extending it pushed your usage into higher slabs. Normalized to ` +
      `30 days, your bill should be approximately Rs ${Math.round(recalculatedAmount).toLocaleString()}. ` +
      `You were overcharged Rs ${Math.round(overcharge).toLocaleString()}.`,
    explanation_urdu:
      `اس بل کی سائیکل تاریخیں: ${bill.reading_date_from} → ${bill.reading_date} (${cycleDays} دن)۔ ` +
      `معیاری سائیکل 30 دن کی ہے۔ لمبی سائیکل سے آپ کی کھپت زیادہ ریٹ والے سلیب میں چلی گئی۔ ` +
      `30 دن پر حساب کرنے سے آپ کا بل تقریباً ${Math.round(recalculatedAmount).toLocaleString()} روپے ہونا چاہیے تھا۔ ` +
      `آپ سے ${Math.round(overcharge).toLocaleString()} روپے زیادہ وصول کیے گئے۔`,
    severity: overcharge > 3000 ? "high" : "medium",
    confidence: "high",
    actual_cycle_days: cycleDays,
  };
}

// ────────────────────────────────────────────────────────────
// A) EXACT — HIGH confidence (Tier 2). Uses the reading_date delta
//    between the current bill and the most recent stored bill for
//    the same reference number + user.
// ────────────────────────────────────────────────────────────
export function detectExtendedCycleExact(
  currentBill: Bill,
  previousBill: Bill
): OverchargeResult | null {
  if (!currentBill.reading_date || !previousBill.reading_date) return null;
  const cycleDays = daysBetweenISO(previousBill.reading_date, currentBill.reading_date);
  if (cycleDays <= 31) return null;

  const expectedUnitsIn30Days = (currentBill.units_billed * 30) / cycleDays;
  const recalculatedAmount = calculateSlabAmount(
    expectedUnitsIn30Days,
    currentBill.tariff_category,
    currentBill.disco_name
  );
  const overcharge = currentBill.total_amount - recalculatedAmount;
  if (overcharge <= 100) return null;

  return {
    pattern_code: "EXTENDED_CYCLE_EXACT",
    pattern_name: "Extended Billing Cycle",
    sro_citation: "NEPRA Act Section 26(1) & SRO 1142(I)/2020",
    overcharge_amount: Math.round(overcharge),
    explanation_english:
      `Measured cycle: ${cycleDays} days (your previous bill dated ${previousBill.reading_date} → ` +
      `this bill dated ${currentBill.reading_date}). The standard cycle is 30 days. Extending the cycle ` +
      `pushed your usage into higher slabs. Normalized to 30 days, your bill should be approximately ` +
      `Rs ${Math.round(recalculatedAmount).toLocaleString()}. You were overcharged ` +
      `Rs ${Math.round(overcharge).toLocaleString()}.`,
    explanation_urdu:
      `ناپی گئی سائیکل: ${cycleDays} دن (پچھلا بل ${previousBill.reading_date} → موجودہ بل ${currentBill.reading_date})۔ ` +
      `معیاری سائیکل 30 دن کی ہے۔ لمبی سائیکل سے آپ کی کھپت زیادہ ریٹ والے سلیب میں چلی گئی۔ ` +
      `30 دن پر حساب کرنے سے آپ کا بل تقریباً ${Math.round(recalculatedAmount).toLocaleString()} روپے ہونا چاہیے تھا۔ ` +
      `آپ سے ${Math.round(overcharge).toLocaleString()} روپے زیادہ وصول کیے گئے۔`,
    severity: overcharge > 3000 ? "high" : "medium",
    confidence: "high",
    actual_cycle_days: cycleDays,
  };
}

// ────────────────────────────────────────────────────────────
// B) INFERRED — MEDIUM confidence. Uses the 12-row consumption history
//    embedded on every bill (from IESCO/auto-fetch). Computes a trimmed
//    mean baseline; cross-checks seasonal variance.
// ────────────────────────────────────────────────────────────

function trimmedMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length >= 5) {
    // Drop top 1 + bottom 1 outlier
    const kept = sorted.slice(1, -1);
    return kept.reduce((s, x) => s + x, 0) / kept.length;
  }
  return sorted.reduce((s, x) => s + x, 0) / sorted.length;
}

function parseBillMonthLabel(label?: string): { monthIdx: number; year: number } | null {
  if (!label) return null;
  const m = label.trim().toUpperCase().match(/^([A-Z]{3})\s+(\d{2,4})$/);
  if (!m) return null;
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const monthIdx = months.indexOf(m[1]);
  if (monthIdx < 0) return null;
  const y = m[2].length === 2 ? 2000 + parseInt(m[2], 10) : parseInt(m[2], 10);
  return { monthIdx, year: y };
}

/**
 * If `currentBillMonth` and a historical entry are the same calendar month
 * one year apart, return the units from that prior-year entry.
 */
function findSameMonthLastYear(
  currentBillMonth: string | undefined,
  history: HistoricalBillEntry[]
): HistoricalBillEntry | null {
  const cur = parseBillMonthLabel(currentBillMonth);
  if (!cur) return null;
  for (const h of history) {
    const ph = parseBillMonthLabel(h.month);
    if (!ph) continue;
    if (ph.monthIdx === cur.monthIdx && ph.year === cur.year - 1) return h;
  }
  return null;
}

export function detectExtendedCycleFromHistory(
  currentBill: Bill,
  historical_bills: HistoricalBillEntry[]
): OverchargeResult | null {
  // Only positive entries count toward the baseline
  const validUnits = historical_bills.map((h) => h.units).filter((u) => u > 0);
  if (validUnits.length < 6) return null;

  const baseline = trimmedMean(validUnits);
  if (baseline <= 0) return null;

  const ratio = currentBill.units_billed / baseline;
  if (ratio <= 1.10) return null;

  // Seasonal cross-check — only possible with a full year of history.
  const hasFullYear = validUnits.length >= 12;
  if (hasFullYear) {
    const sameMonthLastYear = findSameMonthLastYear(currentBill.bill_month, historical_bills);
    if (sameMonthLastYear && sameMonthLastYear.units > 0) {
      const seasonalRatio = currentBill.units_billed / sameMonthLastYear.units;
      // If within 20% of same month last year, treat as seasonal, not extended cycle
      if (seasonalRatio <= 1.20) return null;
    }
  }

  // Infer cycle length: if current ≈ ratio × baseline, the extra ratio approximates
  // the extra cycle days above 30.
  const estimatedCycleDays = Math.round(30 * ratio);
  const recalculatedAmount = calculateSlabAmount(
    Math.round(baseline),
    currentBill.tariff_category,
    currentBill.disco_name
  );
  const overcharge = currentBill.total_amount - recalculatedAmount;
  if (overcharge <= 100) return null;

  const confidenceText = hasFullYear
    ? "12 months of consumption history"
    : `${validUnits.length} months of recent consumption history`;

  return {
    pattern_code: "EXTENDED_CYCLE_INFERRED",
    pattern_name: "Extended Billing Cycle (inferred)",
    sro_citation: "NEPRA Act Section 26(1) & SRO 1142(I)/2020",
    overcharge_amount: Math.round(overcharge),
    explanation_english:
      `Your bill shows ${currentBill.units_billed} units, which is ${Math.round((ratio - 1) * 100)}% above your ` +
      `rolling baseline of ${Math.round(baseline)} units (from ${confidenceText}). This jump, without a matching ` +
      `seasonal increase in the prior year, is consistent with an extended billing cycle of approximately ` +
      `${estimatedCycleDays} days. Normalized to baseline, your bill should be approximately ` +
      `Rs ${Math.round(recalculatedAmount).toLocaleString()} — an estimated overcharge of ` +
      `Rs ${Math.round(overcharge).toLocaleString()}. Request a physical meter check and a copy of the reading log.`,
    explanation_urdu:
      `آپ کا بل ${currentBill.units_billed} یونٹس کا ہے، جو آپ کی ${Math.round(baseline)} یونٹس کی بیس لائن سے ` +
      `${Math.round((ratio - 1) * 100)}٪ زیادہ ہے (بنیاد: ${confidenceText})۔ گزشتہ سال کے اسی ماہ میں ایسا اضافہ نہیں ہوا، ` +
      `جس سے اندازہ ہوتا ہے کہ بلنگ سائیکل تقریباً ${estimatedCycleDays} دن تک بڑھا دی گئی۔ ` +
      `بیس لائن پر حساب کرنے سے بل تقریباً ${Math.round(recalculatedAmount).toLocaleString()} روپے ہونا چاہیے تھا — ` +
      `اندازہً ${Math.round(overcharge).toLocaleString()} روپے زائد وصولی۔ فزیکل میٹر چیک اور ریڈنگ لاگ کی کاپی کا مطالبہ کریں۔`,
    severity: overcharge > 3000 ? "high" : "medium",
    confidence: "medium",
    estimated_cycle_days: estimatedCycleDays,
  };
}
