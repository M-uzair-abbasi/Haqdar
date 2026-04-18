import type { OverchargeResult } from "@/types";

export const COMPLAINT_HEADER_ENGLISH = `THE REGISTRAR
NATIONAL ELECTRIC POWER REGULATORY AUTHORITY (NEPRA)
NEPRA TOWER, ATTATURK AVENUE (EAST), SECTOR G-5/1, ISLAMABAD`;

export const COMPLAINT_HEADER_URDU = `رجسٹرار
نیشنل الیکٹرک پاور ریگولیٹری اتھارٹی (NEPRA)
نیپرا ٹاور، اتاترک ایوینیو (ایسٹ)، سیکٹر G-5/1، اسلام آباد`;

export interface ComplaintParams {
  consumerName: string;
  cnic: string;
  mobile: string;
  email: string;
  address: string;
  discoName: string;
  referenceNumber: string;
  billDate: string;
  billingPeriod: string;
  overcharges: OverchargeResult[];
  totalRefund: number;
  date: string;
}

export function buildComplaintEnglish(p: ComplaintParams): string {
  return `${COMPLAINT_HEADER_ENGLISH}

Date: ${p.date}

Subject: COMPLAINT REGARDING OVERBILLING BY ${p.discoName.toUpperCase()} — REFERENCE: ${p.referenceNumber}

Respected Sir/Madam,

I, ${p.consumerName}, holder of CNIC ${p.cnic}, a registered consumer of ${p.discoName} under reference number ${p.referenceNumber}, hereby file this formal complaint regarding overbilling in my bill dated ${p.billDate} covering the period ${p.billingPeriod}.

SPECIFIC VIOLATIONS DETECTED:
${p.overcharges
  .map(
    (o, i) => `
VIOLATION ${i + 1}: ${o.pattern_name}
Amount Overcharged: Rs ${o.overcharge_amount.toLocaleString()}
Regulatory Citation: ${o.sro_citation}
Details: ${o.explanation_english}`
  )
  .join("\n---")}

TOTAL REFUND DEMANDED: Rs ${p.totalRefund.toLocaleString()}

LEGAL BASIS:
Under NEPRA Act 1997 Section 26(1) and NEPRA Consumer Service Manual 2021, I am entitled to:
1. Investigation of the above violations within 15 working days
2. Full refund of the overcharged amount Rs ${p.totalRefund.toLocaleString()}
3. Adjustment in my next billing cycle or direct credit to my account
4. Physical meter verification upon request
5. Cessation of the documented violation pattern

I respectfully request NEPRA to:
1. Direct ${p.discoName} to refund Rs ${p.totalRefund.toLocaleString()} immediately
2. Investigate the systemic violation pattern identified
3. Provide written confirmation of resolution

My contact details for resolution:
Mobile: ${p.mobile}
Email: ${p.email}
Address: ${p.address}

I certify that the information provided is true to the best of my knowledge and belief.

Yours sincerely,

_________________
${p.consumerName}
CNIC: ${p.cnic}

Attachments:
1. Copy of disputed bill (${p.billDate})
2. Copy of CNIC
3. Previous 3 bills for pattern verification (where applicable)

Generated via Haqdar.pk — Pakistan's Consumer Bill Audit Platform`;
}

export function buildComplaintUrdu(p: ComplaintParams): string {
  return `${COMPLAINT_HEADER_URDU}

تاریخ: ${p.date}

موضوع: ${p.discoName} کی طرف سے زائد بلنگ کی شکایت — ریفرنس: ${p.referenceNumber}

محترم جناب،

میں، ${p.consumerName}، شناختی کارڈ نمبر ${p.cnic}، ${p.discoName} کا رجسٹرڈ صارف، ریفرنس نمبر ${p.referenceNumber}، اپنے ${p.billDate} کے بل جو ${p.billingPeriod} کے عرصے کا ہے، میں زائد وصولی کی رسمی شکایت درج کرا رہا/رہی ہوں۔

مخصوص خلاف ورزیاں:
${p.overcharges
  .map(
    (o, i) => `
خلاف ورزی ${i + 1}: ${o.pattern_name}
زائد وصولی: ${o.overcharge_amount.toLocaleString()} روپے
قانونی حوالہ: ${o.sro_citation}
تفصیل: ${o.explanation_urdu}`
  )
  .join("\n---")}

مطلوبہ کل واپسی: ${p.totalRefund.toLocaleString()} روپے

قانونی بنیاد:
NEPRA ایکٹ 1997 سیکشن 26(1) اور NEPRA کنزیومر سروس مینول 2021 کے تحت میں درج ذیل کا حق رکھتا/رکھتی ہوں:
1. 15 ورکنگ دنوں میں تحقیقات
2. مکمل رقم کی واپسی ${p.totalRefund.toLocaleString()} روپے
3. اگلے بل میں ایڈجسٹمنٹ یا اکاؤنٹ میں کریڈٹ
4. درخواست پر فزیکل میٹر کی تصدیق
5. خلاف ورزی کے سلسلے کو روکنا

NEPRA سے درخواست ہے کہ:
1. ${p.discoName} کو ${p.totalRefund.toLocaleString()} روپے کی فوری واپسی کا حکم دیں
2. اس منظم خلاف ورزی کی تحقیقات کریں
3. حل کی تحریری تصدیق فراہم کریں

رابطہ:
موبائل: ${p.mobile}
ای میل: ${p.email}
پتہ: ${p.address}

میں تصدیق کرتا/کرتی ہوں کہ فراہم کردہ معلومات میرے علم کے مطابق درست ہیں۔

آپ کا مخلص،

_________________
${p.consumerName}
شناختی کارڈ: ${p.cnic}

منسلکات:
1. متنازعہ بل کی کاپی (${p.billDate})
2. شناختی کارڈ کی کاپی
3. پچھلے 3 بلوں کی کاپیاں (اگر قابل اطلاق ہو)

Haqdar.pk — پاکستان کا بل آڈٹ پلیٹ فارم`;
}
