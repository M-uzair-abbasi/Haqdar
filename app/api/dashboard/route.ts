import { NextResponse } from "next/server";
import { listBillsByUser, listComplaintsByUser, getOvercharges, DEMO_USER_ID } from "@/lib/store";
import { getTotalOvercharge } from "@/lib/detection";

export async function GET() {
  const bills = listBillsByUser(DEMO_USER_ID);
  const complaints = listComplaintsByUser(DEMO_USER_ID);
  const allOvercharges = bills.flatMap((b) => getOvercharges(b.id));
  const totalViolations = allOvercharges.length;
  const totalViolationsAmount = getTotalOvercharge(allOvercharges);
  const totalFiled = complaints.filter((c) => c.status === "filed" || c.status === "resolved").length;
  const totalRefunds = complaints.reduce((s, c) => s + (c.refund_amount ?? 0), 0);

  return NextResponse.json({
    bills: bills.map((b) => ({
      ...b,
      overcharges: getOvercharges(b.id),
    })),
    complaints,
    stats: {
      totalBills: bills.length,
      totalViolations,
      totalViolationsAmount,
      totalFiled,
      totalRefunds,
    },
  });
}
