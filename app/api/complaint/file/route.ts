import { NextRequest, NextResponse } from "next/server";
import { updateComplaint, bumpImpact, getImpact } from "@/lib/store";

export async function POST(req: NextRequest) {
  const { complaintId } = await req.json();
  const updated = updateComplaint(complaintId, {
    status: "filed",
    filed_at: new Date().toISOString(),
  });
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  const cur = getImpact();
  bumpImpact({ total_complaints_filed: cur.total_complaints_filed + 1 });
  return NextResponse.json({ success: true, trackingId: updated.id, complaint: updated });
}
