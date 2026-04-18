import { Bill, OverchargeResult } from "@/types";

export function detectFPAOnLifeline(bill: Bill): OverchargeResult | null {
  if (bill.tariff_category !== "lifeline") return null;
  if (!bill.fuel_price_adjustment || bill.fuel_price_adjustment <= 0) return null;

  return {
    pattern_code: "FPA_ON_LIFELINE",
    pattern_name: "Fuel Price Adjustment on Lifeline Consumer",
    sro_citation: "NEPRA SRO 1142(I)/2020 — Lifeline Consumer Protection",
    overcharge_amount: bill.fuel_price_adjustment,
    explanation_english: `Lifeline consumers (using 0-50 units) are legally exempt from Fuel Price Adjustment charges under NEPRA SRO 1142(I)/2020. You were charged Rs ${bill.fuel_price_adjustment.toLocaleString()} in FPA, which directly violates this protection. You are entitled to a full refund of this FPA amount.`,
    explanation_urdu: `لائف لائن صارفین (0-50 یونٹس استعمال کرنے والے) NEPRA SRO 1142(I)/2020 کے تحت فیول پرائس ایڈجسٹمنٹ چارجز سے قانونی طور پر مستثنیٰ ہیں۔ آپ سے ${bill.fuel_price_adjustment.toLocaleString()} روپے FPA وصول کیا گیا، جو اس تحفظ کی براہ راست خلاف ورزی ہے۔ آپ کو اس FPA رقم کی مکمل واپسی کا حق حاصل ہے۔`,
    severity: "high",
  };
}
