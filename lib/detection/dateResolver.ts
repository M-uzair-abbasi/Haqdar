export type DateSource = "user" | "history" | "estimated";

export interface ResolvedDateFrom {
  date: string;                   // ISO YYYY-MM-DD (canonical)
  source: DateSource;
  useForExactDetection: boolean;  // true only for 'user' and 'history'
}

const MONTHS_BY_NAME: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

/**
 * Flexible bill-date parser. Accepts:
 *  - ISO `YYYY-MM-DD`
 *  - IESCO header format `DD MMM YY` (e.g. "24 MAR 26")
 *  - IESCO historical format `DD-MMM-YY` (e.g. "24-MAR-26")
 *  - Two-digit years assumed to be 2000-series.
 */
export function parseBillDate(input: string | null | undefined): Date | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
    return isNaN(d.getTime()) ? null : d;
  }

  const bill = s.match(/^(\d{1,2})[\s-]+([A-Z]{3})[\s-]+(\d{2,4})$/i);
  if (bill) {
    const day = parseInt(bill[1], 10);
    const mo = MONTHS_BY_NAME[bill[2].toUpperCase()];
    const yr = bill[3].length === 2 ? 2000 + parseInt(bill[3], 10) : parseInt(bill[3], 10);
    if (mo === undefined || isNaN(day) || isNaN(yr)) return null;
    const d = new Date(Date.UTC(yr, mo, day));
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Canonical output format: ISO `YYYY-MM-DD`. */
export function formatBillDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Resolve which date to use as the cycle start (reading_date_from).
 *
 * Priority (highest confidence first):
 *   1. `userProvidedDate` — user read it off their previous paper bill.
 *   2. `previousBillDateTo` — end-of-cycle of a stored prior audit.
 *   3. Estimated fallback — `currentReadingDate - 30 days`. DISPLAY ONLY.
 *
 * The estimated fallback MUST NOT be used to compute cycle_days for
 * Rule #1. Doing so would set cycle_days == 30 and make Rule #1 never fire.
 */
export function resolveReadingDateFrom(
  userProvidedDate: string | null | undefined,
  previousBillDateTo: string | null | undefined,
  currentReadingDate: string
): ResolvedDateFrom {
  if (userProvidedDate) {
    const d = parseBillDate(userProvidedDate);
    if (d) {
      return { date: formatBillDate(d), source: "user", useForExactDetection: true };
    }
  }

  if (previousBillDateTo) {
    const d = parseBillDate(previousBillDateTo);
    if (d) {
      return { date: formatBillDate(d), source: "history", useForExactDetection: true };
    }
  }

  const current = parseBillDate(currentReadingDate);
  if (!current) {
    return {
      date: currentReadingDate || "",
      source: "estimated",
      useForExactDetection: false,
    };
  }
  const estimated = new Date(current.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    date: formatBillDate(estimated),
    source: "estimated",
    useForExactDetection: false,
  };
}
