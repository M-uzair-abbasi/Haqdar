import { Bill, OverchargeResult } from "@/types";

export function detectPUGCharges(bill: Bill): OverchargeResult | null {
  if (bill.disco_name !== "SNGPL" && bill.disco_name !== "SSGC") return null;
  if (!bill.pug_charge || bill.pug_charge <= 0) return null;

  return {
    pattern_code: "PUG_UNEXPLAINED_CHARGE",
    pattern_name: "Passed Unregistered Gas Charge",
    sro_citation: "OGRA SNGPL Tariff Rules 2019",
    overcharge_amount: bill.pug_charge,
    explanation_english: `A "PUG" (Passed Unregistered Gas) charge of Rs ${bill.pug_charge.toLocaleString()} was added to your bill. This charge is often used to cover gas theft or meter malfunctions by billing innocent consumers. SNGPL has 381,510 known damaged meters causing inflated bills. You can legally challenge this under OGRA consumer protection rules and demand full refund.`,
    explanation_urdu: `آپ کے بل میں "PUG" چارج ${bill.pug_charge.toLocaleString()} روپے شامل کیا گیا ہے۔ یہ چارج اکثر گیس چوری یا میٹر کی خرابی کو بے گناہ صارفین پر ڈالنے کے لیے استعمال ہوتا ہے۔ آپ OGRA کے صارف تحفظ قوانین کے تحت اسے قانونی طور پر چیلنج کر سکتے ہیں۔`,
    severity: "high",
    confidence: "high",
  };
}
