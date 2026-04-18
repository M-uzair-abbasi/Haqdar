import { NextRequest, NextResponse } from "next/server";
import { insertBill, saveOvercharges, bumpImpact, getImpact, DEMO_USER_ID } from "@/lib/store";
import { runAllDetections, getTotalOvercharge } from "@/lib/detection";
import { dayDiff } from "@/lib/slabCalculator";

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const billing_days = dayDiff(body.dateFrom, body.dateTo);
    const bill = insertBill({
      user_id: body.userId ?? DEMO_USER_ID,
      disco_name: body.disco,
      reference_number: body.referenceNumber,
      units_billed: Number(body.units),
      reading_date_from: body.dateFrom,
      reading_date_to: body.dateTo,
      billing_days,
      total_amount: Number(body.amount),
      tariff_category: body.tariff,
      reading_type: body.readingType,
      fuel_price_adjustment: Number(body.fpa || 0),
      pug_charge: Number(body.pugCharge || 0),
      raw_input: body,
    });

    const overcharges = runAllDetections(bill);
    const stamped = saveOvercharges(bill.id, overcharges);
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
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "audit failed" }, { status: 500 });
  }
}
