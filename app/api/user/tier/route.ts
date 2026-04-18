import { NextRequest, NextResponse } from "next/server";
import { updateUser, DEMO_USER_ID } from "@/lib/store";

// Demo-only tier switcher. Lets judges toggle Free/Pro/Business during the pitch
// to see both the paywall and the Pro auto-fetch UX.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const tier = String(body?.tier ?? "").toLowerCase();
  if (!["free", "pro", "business"].includes(tier)) {
    return NextResponse.json({ error: "invalid tier" }, { status: 400 });
  }
  const status = tier === "free" ? "inactive" : "active";
  const user = updateUser(DEMO_USER_ID, { subscription_tier: tier as any, subscription_status: status as any });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ user });
}
