import { Bill, OverchargeResult } from "@/types";

export function detectChainedEstimates(bill: Bill): OverchargeResult | null {
  if (bill.reading_type !== "chained_estimated") return null;

  const estimateInflationFactor = 0.10;
  const estimatedOvercharge = bill.total_amount * estimateInflationFactor;

  return {
    pattern_code: "CHAINED_ESTIMATED_READINGS",
    pattern_name: "Chained Estimated Readings",
    sro_citation: "NEPRA Consumer Service Manual 2021 — Mandatory Physical Reading",
    overcharge_amount: Math.round(estimatedOvercharge),
    explanation_english: `Your last 3+ bills were all estimated rather than physically read. NEPRA Consumer Service Manual 2021 mandates a physical reading at least every 3 months. Estimated readings typically inflate actual consumption by 10-15%. You are entitled to demand a corrective physical reading and refund of approximately Rs ${Math.round(estimatedOvercharge).toLocaleString()}.`,
    explanation_urdu: `آپ کے پچھلے 3 یا زیادہ بل اندازے پر مبنی تھے، فزیکل ریڈنگ نہیں ہوئی۔ NEPRA کنزیومر سروس مینول 2021 کے تحت کم از کم ہر 3 ماہ بعد فزیکل ریڈنگ لازمی ہے۔ تخمینی ریڈنگز عام طور پر اصل کھپت سے 10-15 فیصد زیادہ ہوتی ہیں۔`,
    severity: "high",
    confidence: "medium",
  };
}
