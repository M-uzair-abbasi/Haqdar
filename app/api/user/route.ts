import { NextResponse } from "next/server";
import { getUser, DEMO_USER_ID } from "@/lib/store";

export async function GET() {
  const user = getUser(DEMO_USER_ID);
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ user });
}
