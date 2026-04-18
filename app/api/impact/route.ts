import { NextResponse } from "next/server";
import { getImpact } from "@/lib/store";

const LIVE_FEED_ITEMS = [
  { name: "Fatima", city: "Karachi", amount: 3240, action: "recovered", timeAgo: "2 min" },
  { name: "Hassan", city: "Lahore", amount: 5820, action: "filed complaint", timeAgo: "5 min" },
  { name: "Ayesha", city: "Islamabad", amount: 12400, action: "ordered to refund", timeAgo: "18 min" },
  { name: "Bilal", city: "Rawalpindi", amount: 2180, action: "recovered", timeAgo: "22 min" },
  { name: "Sana", city: "Faisalabad", amount: 8940, action: "filed complaint", timeAgo: "31 min" },
  { name: "Usman", city: "Multan", amount: 4120, action: "recovered", timeAgo: "44 min" },
  { name: "Zainab", city: "Peshawar", amount: 6700, action: "filed complaint", timeAgo: "58 min" },
  { name: "Ahmed", city: "Gujranwala", amount: 9230, action: "ordered to refund", timeAgo: "1 hr" },
  { name: "Mariam", city: "Hyderabad", amount: 1890, action: "recovered", timeAgo: "1 hr" },
  { name: "Imran", city: "Quetta", amount: 7450, action: "filed complaint", timeAgo: "2 hr" },
];

export async function GET() {
  return NextResponse.json({ impact: getImpact(), feed: LIVE_FEED_ITEMS });
}
