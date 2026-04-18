import { NextRequest, NextResponse } from "next/server";
import {
  insertBill,
  saveOvercharges,
  saveNotices,
  bumpImpact,
  getImpact,
  findPreviousBillByRef,
  DEMO_USER_ID,
} from "@/lib/store";
import { runAllDetections, getTotalOvercharge } from "@/lib/detection";
import type { HistoricalBillEntry } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const userId: string = body.userId ?? DEMO_USER_ID;
    const refNo: string = body.referenceNumber ?? "";

    // Canonical end-of-cycle date. Accept `readingDate` (new) or `dateTo` (legacy).
    const readingDate: string = body.readingDate ?? body.dateTo ?? "";
    const legacyDateFrom: string | undefined = body.dateFrom || undefined;

    // Normalize historical_bills payload from auto-fetch.
    const historical: HistoricalBillEntry[] | undefined = Array.isArray(body.historicalBills)
      ? body.historicalBills.map((h: any) => ({
          month: String(h.month ?? ""),
          units: Number(h.units ?? 0),
          bill: Number(h.bill ?? 0),
          payment: Number(h.payment ?? 0),
        }))
      : undefined;

    const bill = insertBill({
      user_id: userId,
      disco_name: body.disco,
      reference_number: refNo,
      units_billed: Number(body.units),
      reading_date: readingDate,
      bill_month: body.billMonth ?? undefined,
      historical_bills: historical,
      reading_date_from: legacyDateFrom ?? readingDate,
      reading_date_to: readingDate,
      total_amount: Number(body.amount),
      tariff_category: body.tariff,
      reading_type: body.readingType,
      fuel_price_adjustment: Number(body.fpa || 0),
      pug_charge: Number(body.pugCharge || 0),
      raw_input: body,
    });

    // HIGH-confidence path: look up a stored previous bill for same ref + user.
    const previousBill = refNo && readingDate
      ? findPreviousBillByRef(refNo, userId, readingDate)
      : null;

    const { overcharges, notices } = runAllDetections(bill, { previousBill });
    const stamped = saveOvercharges(bill.id, overcharges);
    saveNotices(bill.id, notices);
    const total = getTotalOvercharge(overcharges);

    const cur = getImpact();
    bumpImpact({
      total_bills_audited: cur.total_bills_audited + 1,
      total_overcharges_found: cur.total_overcharges_found + total,
    });

    return NextResponse.json({
      billId: bill.id,
      bill,
      overcharges: stamped,
      totalOvercharge: total,
      notices,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "audit failed" }, { status: 500 });
  }
}
