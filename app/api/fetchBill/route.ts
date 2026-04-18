import { NextRequest, NextResponse } from "next/server";
import { scrapeBill, IescoScraperError, type Disco } from "@/lib/scrapers";
import { getUser, getBillCache, setBillCache, DEMO_USER_ID } from "@/lib/store";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { disco, referenceNumber } = body as { disco: Disco; referenceNumber: string };
    const userId: string = body?.userId || DEMO_USER_ID;

    if (!disco || !referenceNumber) {
      return NextResponse.json(
        { success: false, error: "MISSING_FIELDS", message: "disco and referenceNumber are required" },
        { status: 400 }
      );
    }

    // ========================================
    // SUBSCRIPTION GATE — BLOCK FREE USERS
    // ========================================
    const user = getUser(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "USER_NOT_FOUND", message: "User not found" },
        { status: 404 }
      );
    }

    const tier = (user.subscription_tier || "").toLowerCase();
    const status = (user.subscription_status || "").toLowerCase();
    const isPaidTier = tier === "pro" || tier === "business";
    const isActive = status === "active" || status === "trialing";

    if (!isPaidTier || !isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "SUBSCRIPTION_REQUIRED",
          message: "Auto-fetch is a Pro feature. Upgrade to Pro for Rs 99/month to auto-fetch your bill.",
          upgrade_url: "/pricing",
          current_tier: tier || "free",
        },
        { status: 403 }
      );
    }
    // ========================================
    // END SUBSCRIPTION GATE
    // ========================================

    // Cache check (24h TTL)
    const refHash = createHash("sha256").update(`${disco}:${referenceNumber}`).digest("hex").slice(0, 32);
    const cached = getBillCache(refHash);
    if (cached) {
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age < 24 * 60 * 60 * 1000) {
        return NextResponse.json({ success: true, bill: cached.bill_data, cached: true, cached_at: cached.fetched_at });
      }
    }

    // Live scrape
    const bill = await scrapeBill(disco, referenceNumber);

    setBillCache(refHash, {
      disco,
      reference_number: bill.reference_number,
      bill_data: bill,
      fetched_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, bill, cached: false });
  } catch (err: any) {
    if (err instanceof IescoScraperError) {
      const statusMap: Record<string, number> = {
        INVALID_REFERENCE: 400,
        NOT_FOUND: 404,
        RATE_LIMITED: 429,
        NETWORK_ERROR: 503,
        PARSING_FAILED: 500,
      };
      return NextResponse.json(
        { success: false, error: err.code, message: err.message },
        { status: statusMap[err.code] || 500 }
      );
    }
    console.error("fetchBill unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "An unexpected error occurred. Please try manual entry." },
      { status: 500 }
    );
  }
}
