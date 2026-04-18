import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import { ComplaintPDF } from "@/components/ComplaintPDF";
import { getComplaint, getOvercharges } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const complaint = getComplaint(id);
  if (!complaint) return NextResponse.json({ error: "not found" }, { status: 404 });
  const overcharges = getOvercharges(complaint.bill_id);

  const today = new Date().toISOString().slice(0, 10);
  const element = React.createElement(ComplaintPDF, {
    consumerName: complaint.consumer_name ?? "Consumer",
    cnic: complaint.cnic ?? "",
    mobile: complaint.mobile ?? "",
    email: complaint.email ?? "",
    address: complaint.address ?? "",
    discoName: complaint.disco_name ?? "",
    referenceNumber: complaint.reference_number ?? "",
    billDate: today,
    billingPeriod: today,
    overcharges,
    totalRefund: complaint.total_refund_claimed,
    date: today,
    language: complaint.language ?? "both",
    complaintTextEnglish: complaint.complaint_text_english,
    complaintTextUrdu: complaint.complaint_text_urdu,
  });

  const stream = await renderToStream(element as any);
  return new NextResponse(stream as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="haqdar-complaint-${id}.pdf"`,
    },
  });
}
