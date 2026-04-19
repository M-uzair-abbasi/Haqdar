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
import { resolveReadingDateFrom } from "@/lib/detection/dateResolver";
import type { HistoricalBillEntry } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const userId: string = body.userId ?? DEMO_USER_ID;
    const refNo: string = body.referenceNumber ?? "";

    // Canonical end-of-cycle date. Accept `readingDate` (new) or `dateTo` (legacy).
    // If the scraper couldn't extract it and the user skipped it on the form,
    // fall back to today so downstream storage + UI have something to render.
    // The Tier 3 guard (from !== to) will still cause Rule #1 to skip cleanly.
    const todayISO = new Date().toISOString().slice(0, 10);
    const readingDate: string = body.readingDate || body.dateTo || todayISO;
    // Optional cycle start date. When present, enables Tier 3 (HIGH confidence)
    // detection directly from the bill's own dates.
    const dateFrom: string | undefined = body.dateFrom || undefined;

    // Normalize historical_bills payload from auto-fetch.
    const historical: HistoricalBillEntry[] | undefined = Array.isArray(body.historicalBills)
      ? body.historicalBills.map((h: any) => ({
          month: String(h.month ?? ""),
          units: Number(h.units ?? 0),
          bill: Number(h.bill ?? 0),
          payment: Number(h.payment ?? 0),
        }))
      : undefined;

    // Look up stored prior bill first so we can resolve cycle start before insert.
    const previousBill = refNo && readingDate
      ? findPreviousBillByRef(refNo, userId, readingDate)
      : null;

    // Resolve the cycle-start date with provenance. Only user/history sources
    // are eligible for Tier 3 exact detection — estimated is DISPLAY ONLY.
    const resolved = resolveReadingDateFrom(
      dateFrom ?? null,
      previousBill?.reading_date ?? null,
      readingDate
    );

    const bill = insertBill({
      user_id: userId,
      disco_name: body.disco,
      reference_number: refNo,
      units_billed: Number(body.units),
      reading_date: readingDate,
      bill_month: body.billMonth ?? undefined,
      historical_bills: historical,
      // reading_date_from is the trust-worthy cycle start for detection.
      // Collapse to reading_date when source==="estimated" so the Tier 3 guard
      // rejects it and Rule #1 falls through to Tier 1 / notice.
      reading_date_from: resolved.useForExactDetection ? resolved.date : readingDate,
      reading_date_to: readingDate,
      // Always persist the resolver's output + source so the UI can show the
      // provenance badge and the PDF can render a "billing period" line.
      resolved_date_from: resolved.date,
      date_from_source: resolved.source,
      total_amount: Number(body.amount),
      tariff_category: body.tariff,
      reading_type: body.readingType,
      fuel_price_adjustment: Number(body.fpa || 0),
      pug_charge: Number(body.pugCharge || 0),
      raw_input: body,
    });

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
