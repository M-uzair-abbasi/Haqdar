import { Bill, OverchargeResult } from "@/types";
import { calculateSlabAmount } from "../slabCalculator";

export function detectSlabAbuse(bill: Bill): OverchargeResult | null {
  const thresholds = [200, 300, 400, 500, 700];
  const justOverThreshold = thresholds.find(
    (t) => bill.units_billed > t && bill.units_billed <= t + 10
  );

  if (!justOverThreshold) return null;

  const amountAtThreshold = calculateSlabAmount(
    justOverThreshold,
    bill.tariff_category,
    bill.disco_name
  );
  const currentAmount = calculateSlabAmount(
    bill.units_billed,
    bill.tariff_category,
    bill.disco_name
  );
  const overchargeEstimate = Math.max(0, currentAmount - amountAtThreshold);

  return {
    pattern_code: "SUSPICIOUS_SLAB_THRESHOLD",
    pattern_name: "Suspicious Slab Threshold",
    sro_citation: "NEPRA Tariff Determination 2024",
    overcharge_amount: Math.round(overchargeEstimate),
    explanation_english: `Your reading of ${bill.units_billed} units is suspiciously close to the ${justOverThreshold}-unit slab threshold. Meter readings are often rounded up at these boundaries to push consumers into higher tariff slabs. You are entitled to request a physical meter verification under NEPRA rules.`,
    explanation_urdu: `آپ کی ${bill.units_billed} یونٹس کی ریڈنگ ${justOverThreshold} یونٹس کے سلیب کی حد کے بہت قریب ہے۔ میٹر ریڈنگز اکثر ان حدوں پر اوپر کر دی جاتی ہیں تاکہ صارفین کو اگلے ٹیرف سلیب میں دھکیلا جا سکے۔ NEPRA کے قوانین کے تحت آپ کو فزیکل میٹر کی تصدیق کا حق حاصل ہے۔`,
    severity: "medium",
  };
}
