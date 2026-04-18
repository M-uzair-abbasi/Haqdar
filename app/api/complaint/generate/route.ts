import { NextRequest, NextResponse } from "next/server";
import { getBill, getOvercharges, insertComplaint, DEMO_USER_ID } from "@/lib/store";
import { buildComplaintEnglish, buildComplaintUrdu } from "@/lib/complaintTemplates";
import { getTotalOvercharge } from "@/lib/detection";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const bill = getBill(body.billId);
  if (!bill) return NextResponse.json({ error: "bill not found" }, { status: 404 });

  const overcharges = getOvercharges(bill.id);
  const totalRefund = getTotalOvercharge(overcharges);
  const today = new Date().toISOString().slice(0, 10);

  const tpl = {
    consumerName: body.consumerName ?? "Consumer",
    cnic: body.cnic ?? "",
    mobile: body.mobile ?? "",
    email: body.email ?? "",
    address: body.address ?? "",
    discoName: bill.disco_name,
    referenceNumber: bill.reference_number,
    billDate: today,
    billingPeriod: `${bill.reading_date_from} to ${bill.reading_date_to}`,
    overcharges,
    totalRefund,
    date: today,
  };

  const english = buildComplaintEnglish(tpl);
  const urdu = buildComplaintUrdu(tpl);

  const complaint = insertComplaint({
    user_id: body.userId ?? DEMO_USER_ID,
    bill_id: bill.id,
    overcharge_ids: overcharges.map((o) => o.id!).filter(Boolean),
    regulator: bill.disco_name === "SNGPL" || bill.disco_name === "SSGC" ? "OGRA" : "NEPRA",
    total_refund_claimed: totalRefund,
    complaint_text_english: english,
    complaint_text_urdu: urdu,
    pdf_url: null,
    status: "generated",
    filed_at: null,
    resolved_at: null,
    refund_amount: null,
    consumer_name: tpl.consumerName,
    cnic: tpl.cnic,
    mobile: tpl.mobile,
    email: tpl.email,
    address: tpl.address,
    disco_name: bill.disco_name,
    reference_number: bill.reference_number,
    language: body.language ?? "both",
  });

  return NextResponse.json({
    complaintId: complaint.id,
    complaint,
    complaintTextEnglish: english,
    complaintTextUrdu: urdu,
  });
}
