export type SubscriptionTier = "free" | "pro" | "business";
export type SubscriptionStatus = "active" | "trialing" | "inactive" | "canceled";

export function canUseAutoFetch(tier?: string | null, status?: string | null): boolean {
  const t = (tier || "").toLowerCase();
  const s = (status || "").toLowerCase();
  const isPaidTier = t === "pro" || t === "business";
  const isActive = s === "active" || s === "trialing";
  return isPaidTier && isActive;
}
