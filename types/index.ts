export type Severity = "low" | "medium" | "high";
export type Confidence = "high" | "medium" | "low";

export interface HistoricalBillEntry {
  month: string;   // e.g. "APR 25"
  units: number;
  bill: number;
  payment: number;
}

export interface Bill {
  id: string;
  user_id?: string | null;
  disco_name: string;
  reference_number: string;
  units_billed: number;
  // Canonical end-of-cycle date (ISO YYYY-MM-DD). Real bills only show this;
  // cycle length is inferred from prev bills or the embedded history.
  reading_date: string;
  bill_month?: string;                     // e.g. "APR 26" from the IESCO header
  historical_bills?: HistoricalBillEntry[]; // 12-row consumption history from IESCO bills
  // Resolved cycle start + provenance (set by lib/detection/dateResolver.ts).
  // `date_from_source === "estimated"` must NOT be used for Rule #1 detection.
  resolved_date_from?: string;                     // ISO YYYY-MM-DD, always populated when reading_date is known
  date_from_source?: "user" | "history" | "estimated";
  // Legacy fields — retained optionally so older code paths still compile.
  // reading_date_from mirrors reading_date when unknown; billing_days is 0/undefined when unknown.
  reading_date_from?: string;
  reading_date_to?: string;
  billing_days?: number;
  total_amount: number;
  tariff_category: string;
  reading_type: string;
  fuel_price_adjustment: number;
  pug_charge: number;
  raw_input?: Record<string, unknown>;
  created_at: string;
}

export interface OverchargeResult {
  id?: string;
  bill_id?: string;
  pattern_code: string;
  pattern_name: string;
  sro_citation: string;
  overcharge_amount: number;
  explanation_english: string;
  explanation_urdu: string;
  severity: Severity;
  confidence: Confidence;
  actual_cycle_days?: number;
  estimated_cycle_days?: number;
  detected_at?: string;
}

export interface AuditNotice {
  code: "EXTENDED_CYCLE_SKIPPED_NO_HISTORY";
  title_english: string;
  title_urdu: string;
  body_english: string;
  body_urdu: string;
}

export interface UserRecord {
  id: string;
  phone?: string;
  name?: string;
  cnic?: string;
  email?: string;
  address?: string;
  subscription_tier: "free" | "pro" | "business";
  subscription_status: "active" | "trialing" | "inactive" | "canceled";
  trial_ends_at: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  user_id?: string | null;
  bill_id: string;
  overcharge_ids: string[];
  regulator: "NEPRA" | "OGRA";
  total_refund_claimed: number;
  complaint_text_english: string;
  complaint_text_urdu: string;
  pdf_url?: string | null;
  status: "generated" | "filed" | "resolved";
  filed_at?: string | null;
  resolved_at?: string | null;
  refund_amount?: number | null;
  created_at: string;
  consumer_name?: string;
  cnic?: string;
  mobile?: string;
  email?: string;
  address?: string;
  disco_name?: string;
  reference_number?: string;
  language?: "english" | "urdu" | "both";
}

export interface ImpactStats {
  total_bills_audited: number;
  total_overcharges_found: number;
  total_complaints_filed: number;
  total_refunds_received: number;
  active_users: number;
  updated_at: string;
}
