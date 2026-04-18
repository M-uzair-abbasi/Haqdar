import type { Bill, OverchargeResult, Complaint, ImpactStats, UserRecord, AuditNotice } from "@/types";
import { uid } from "./utils";

// In-memory store. Seeded with demo data so UI feels "real" without Supabase credentials.
// A production deployment would swap this for Supabase calls.

type FetchedBillCache = {
  disco: string;
  reference_number: string;
  bill_data: unknown;
  fetched_at: string;
};

type DB = {
  users: Map<string, UserRecord>;
  bills: Map<string, Bill>;
  overcharges: Map<string, OverchargeResult[]>; // keyed by bill_id
  notices: Map<string, AuditNotice[]>;          // keyed by bill_id
  complaints: Map<string, Complaint>;
  impact: ImpactStats;
  billCache: Map<string, FetchedBillCache>; // keyed by ref_hash
};

declare global {
  // eslint-disable-next-line no-var
  var __HAQDAR_DB__: DB | undefined;
}

function freshDB(): DB {
  const users = new Map<string, UserRecord>();
  const demoUserId = "demo-user";
  users.set(demoUserId, {
    id: demoUserId,
    name: "Demo User",
    cnic: "42101-1234567-1",
    email: "demo@haqdar.pk",
    phone: "+923001234567",
    address: "Karachi, Pakistan",
    subscription_tier: "pro",
    subscription_status: "trialing",
    trial_ends_at: new Date(Date.now() + 14 * 864e5).toISOString(),
    created_at: new Date().toISOString(),
  });

  return {
    users,
    bills: new Map(),
    overcharges: new Map(),
    notices: new Map(),
    complaints: new Map(),
    billCache: new Map(),
    impact: {
      total_bills_audited: 2847,
      total_overcharges_found: 3140000,
      total_complaints_filed: 1893,
      total_refunds_received: 847000,
      active_users: 412,
      updated_at: new Date().toISOString(),
    },
  };
}

function db(): DB {
  if (!globalThis.__HAQDAR_DB__) globalThis.__HAQDAR_DB__ = freshDB();
  return globalThis.__HAQDAR_DB__;
}

export const DEMO_USER_ID = "demo-user";

export function insertBill(bill: Omit<Bill, "id" | "created_at">): Bill {
  const id = uid();
  // billing_days is informational only now — cycle length comes from prev bill
  // or from historical_bills. Populate it only when both endpoints are present.
  let billing_days: number | undefined = bill.billing_days;
  if (billing_days == null && bill.reading_date_from && bill.reading_date_to) {
    const diff = (new Date(bill.reading_date_to).getTime() - new Date(bill.reading_date_from).getTime()) / 86400000;
    if (isFinite(diff) && diff > 0) billing_days = Math.round(diff);
  }
  const record: Bill = {
    ...bill,
    id,
    billing_days,
    created_at: new Date().toISOString(),
  };
  db().bills.set(id, record);
  return record;
}

export function getBill(id: string): Bill | null {
  return db().bills.get(id) ?? null;
}

export function listBillsByUser(userId: string): Bill[] {
  return Array.from(db().bills.values())
    .filter((b) => b.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function findPreviousBillByRef(
  referenceNumber: string,
  userId: string,
  beforeISO: string
): Bill | null {
  const refNorm = referenceNumber.replace(/\s+/g, "").toUpperCase();
  const beforeTs = new Date(beforeISO).getTime();
  const candidates = Array.from(db().bills.values()).filter((b) => {
    if (b.user_id !== userId) return false;
    const bRef = (b.reference_number ?? "").replace(/\s+/g, "").toUpperCase();
    if (bRef !== refNorm) return false;
    if (!b.reading_date) return false;
    const t = new Date(b.reading_date).getTime();
    return isFinite(t) && t < beforeTs;
  });
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => new Date(b.reading_date!).getTime() - new Date(a.reading_date!).getTime());
  return candidates[0];
}

export function saveOvercharges(billId: string, items: OverchargeResult[]): OverchargeResult[] {
  const stamped = items.map((o) => ({
    ...o,
    id: uid(),
    bill_id: billId,
    detected_at: new Date().toISOString(),
  }));
  db().overcharges.set(billId, stamped);
  return stamped;
}

export function getOvercharges(billId: string): OverchargeResult[] {
  return db().overcharges.get(billId) ?? [];
}

export function saveNotices(billId: string, notices: AuditNotice[]): void {
  db().notices.set(billId, notices);
}

export function getNotices(billId: string): AuditNotice[] {
  return db().notices.get(billId) ?? [];
}

export function insertComplaint(c: Omit<Complaint, "id" | "created_at">): Complaint {
  const id = uid();
  const record: Complaint = {
    ...c,
    id,
    created_at: new Date().toISOString(),
  };
  db().complaints.set(id, record);
  return record;
}

export function getComplaint(id: string): Complaint | null {
  return db().complaints.get(id) ?? null;
}

export function updateComplaint(id: string, patch: Partial<Complaint>): Complaint | null {
  const existing = db().complaints.get(id);
  if (!existing) return null;
  const next = { ...existing, ...patch };
  db().complaints.set(id, next);
  return next;
}

export function listComplaintsByUser(userId: string): Complaint[] {
  return Array.from(db().complaints.values())
    .filter((c) => c.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getImpact(): ImpactStats {
  return { ...db().impact };
}

export function bumpImpact(patch: Partial<ImpactStats>): ImpactStats {
  const cur = db().impact;
  const next: ImpactStats = {
    ...cur,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  db().impact = next;
  return next;
}

export function getUser(id: string): UserRecord | null {
  return db().users.get(id) ?? null;
}

export function updateUser(id: string, patch: Partial<UserRecord>): UserRecord | null {
  const existing = db().users.get(id);
  if (!existing) return null;
  const next = { ...existing, ...patch };
  db().users.set(id, next);
  return next;
}

export function getBillCache(refHash: string): FetchedBillCache | null {
  return db().billCache.get(refHash) ?? null;
}

export function setBillCache(refHash: string, entry: FetchedBillCache): void {
  db().billCache.set(refHash, entry);
}
