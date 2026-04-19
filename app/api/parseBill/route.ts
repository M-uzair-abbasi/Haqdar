import { NextRequest, NextResponse } from "next/server";
import { parseIescoHtml, IescoScraperError } from "@/lib/scrapers/iesco";
import { getUser, setBillCache, DEMO_USER_ID } from "@/lib/store";
import { createHash } from "crypto";

// Client-side-fallback parser endpoint. Accepts HTML that the user's browser
// fetched from IESCO via a CORS proxy (using their Pakistani IP, bypassing
// Vercel's firewalled outbound route). We only parse it here — the
// subscription gate is still enforced identically to /api/fetchBill.
export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const disco: string = body.disco;
    const referenceNumber: string = body.referenceNumber;
    const html: string = body.html;
    const userId: string = body.userId || DEMO_USER_ID;

    if (!disco || !referenceNumber || !html) {
      return NextResponse.json(
        { success: false, error: "MISSING_FIELDS", message: "disco, referenceNumber, and html are required" },
        { status: 400 }
      );
    }

    // SUBSCRIPTION GATE — identical to /api/fetchBill. Parse is a Pro feature.
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
          message: "Auto-fetch is a Pro feature. Upgrade to Pro for Rs 60/month to auto-fetch your bill.",
          upgrade_url: "/pricing",
          current_tier: tier || "free",
        },
        { status: 403 }
      );
    }

    if (disco !== "IESCO") {
      return NextResponse.json(
        { success: false, error: "UNSUPPORTED_DISCO", message: `${disco} auto-fetch is coming soon. Please use manual entry.` },
        { status: 400 }
      );
    }

    const bill = parseIescoHtml(html);

    // Same 24h cache as fetchBill so subsequent audits are instant.
    const refHash = createHash("sha256").update(`${disco}:${referenceNumber}`).digest("hex").slice(0, 32);
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
      console.error("[parseBill] parse error:", err.code, err.debugHint ?? "(no hint)");
      return NextResponse.json(
        {
          success: false,
          error: err.code,
          message: err.message,
          ...(err.debugHint ? { debug: err.debugHint } : {}),
        },
        { status: statusMap[err.code] || 500 }
      );
    }
    console.error("[parseBill] unexpected error:", err?.name, err?.message);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred. Please try manual entry.",
        debug: `${err?.name ?? "err"}: ${err?.message ?? "unknown"}`,
      },
      { status: 500 }
    );
  }
}
