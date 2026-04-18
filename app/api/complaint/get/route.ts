import { NextRequest, NextResponse } from "next/server";
import { getComplaint, getOvercharges, getBill } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const complaint = getComplaint(id);
  if (!complaint) return NextResponse.json({ error: "not found" }, { status: 404 });
  const overcharges = getOvercharges(complaint.bill_id);
  const bill = getBill(complaint.bill_id);
  return NextResponse.json({ complaint, overcharges, bill });
}
