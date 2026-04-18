export type Severity = "low" | "medium" | "high";

export interface Bill {
  id: string;
  user_id?: string | null;
  disco_name: string;
  reference_number: string;
  units_billed: number;
  reading_date_from: string;
  reading_date_to: string;
  billing_days: number;
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
  detected_at?: string;
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
