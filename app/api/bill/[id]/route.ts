import { NextResponse } from "next/server";
import { getBill, getOvercharges } from "@/lib/store";
import { getTotalOvercharge } from "@/lib/detection";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const bill = getBill(params.id);
  if (!bill) return NextResponse.json({ error: "not found" }, { status: 404 });
  const overcharges = getOvercharges(params.id);
  return NextResponse.json({
    bill,
    overcharges,
    totalOvercharge: getTotalOvercharge(overcharges),
  });
}
