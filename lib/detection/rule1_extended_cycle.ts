import { Bill, OverchargeResult } from "@/types";
import { calculateSlabAmount } from "../slabCalculator";

export function detectExtendedCycle(bill: Bill): OverchargeResult | null {
  if (bill.billing_days <= 31) return null;

  const expectedUnitsIn30Days = (bill.units_billed * 30) / bill.billing_days;
  const recalculatedAmount = calculateSlabAmount(
    expectedUnitsIn30Days,
    bill.tariff_category,
    bill.disco_name
  );
  const overchargeAmount = bill.total_amount - recalculatedAmount;

  if (overchargeAmount <= 100) return null;

  return {
    pattern_code: "EXTENDED_BILLING_CYCLE",
    pattern_name: "Extended Billing Cycle",
    sro_citation: "NEPRA Act Section 26(1) & SRO 1142(I)/2020",
    overcharge_amount: Math.round(overchargeAmount),
    explanation_english: `Your bill covers ${bill.billing_days} days instead of the standard 30. This pushed your usage into higher slabs. Normalized to 30 days, your bill should be approximately Rs ${Math.round(recalculatedAmount).toLocaleString()}. You were overcharged Rs ${Math.round(overchargeAmount).toLocaleString()}. NEPRA's 2024 inquiry confirmed this pattern affected 5.1 million consumers in FY24.`,
    explanation_urdu: `آپ کا بل ${bill.billing_days} دن کا ہے، معیاری 30 دن کی بجائے۔ اس سے آپ کی کھپت زیادہ ریٹ والے سلیب میں چلی گئی۔ 30 دن پر حساب کرنے سے آپ کا بل تقریباً ${Math.round(recalculatedAmount).toLocaleString()} روپے ہونا چاہیے تھا۔ آپ سے ${Math.round(overchargeAmount).toLocaleString()} روپے زیادہ وصول کیے گئے۔`,
    severity: overchargeAmount > 3000 ? "high" : "medium",
  };
}
