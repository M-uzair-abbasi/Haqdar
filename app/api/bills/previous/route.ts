import { NextRequest, NextResponse } from "next/server";
import { findPreviousBillByRef, DEMO_USER_ID } from "@/lib/store";

// Used by the scan form to auto-fill "Reading Date From" with the previous
// bill's end-of-cycle date for the same reference number + user. Enables
// Tier 3 (HIGH confidence) detection on the very first audit after a user
// has any prior bill on record.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const refNo = searchParams.get("referenceNumber") ?? "";
  const userId = searchParams.get("userId") ?? DEMO_USER_ID;
  if (!refNo) {
    return NextResponse.json({ readingDate: null, source: null });
  }
  // "Previous" = any stored bill for this ref + user with reading_date
  // earlier than now. We use a forward-shifted upper bound so backdated
  // demo bills still resolve.
  const upperBound = new Date(Date.now() + 86400000).toISOString();
  const prev = findPreviousBillByRef(refNo, userId, upperBound);
  if (!prev || !prev.reading_date) {
    return NextResponse.json({ readingDate: null, source: null });
  }
  return NextResponse.json({ readingDate: prev.reading_date, source: "prev_audit" });
}
