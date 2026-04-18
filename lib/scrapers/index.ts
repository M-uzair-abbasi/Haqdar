import { scrapeIescoBill, IescoScraperError } from "./iesco";
import type { ScrapedBill } from "./iesco";

export type Disco =
  | "IESCO" | "LESCO" | "MEPCO" | "PESCO" | "HESCO"
  | "SEPCO" | "QESCO" | "GEPCO" | "FESCO" | "TESCO" | "KE";

export const SUPPORTED_DISCOS: Disco[] = ["IESCO"];

export async function scrapeBill(disco: Disco, referenceNumber: string): Promise<ScrapedBill> {
  if (disco === "IESCO") return scrapeIescoBill(referenceNumber);
  throw new Error(`${disco} auto-fetch is coming soon. Please use manual entry.`);
}

export { IescoScraperError };
export type { ScrapedBill };
