import "./_polyfill"; // MUST be first — stubs File/FormData/Blob for Node 18 before undici loads
import * as cheerio from "cheerio";
import { createHash } from "crypto";

const IESCO_BASE_URL = "https://bill.pitc.com.pk/iescobill/general";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface ScrapedBill {
  reference_number: string;
  consumer_id: string;
  customer_name: string;
  tariff: string;
  bill_month: string;
  issue_date: string;
  due_date: string;
  reading_date: string;
  connection_date: string;
  connected_load: string;
  meter_number: string;
  previous_reading: number;
  present_reading: number;
  multiplying_factor: number;
  units_billed: number;
  cost_of_electricity: number;
  fixed_charges: number;
  fuel_price_adjustment: number;
  total_fpa: number;
  fc_surcharge: number;
  qtr_tariff_adjustment: number;
  electricity_duty: number;
  gst: number;
  income_tax: number;
  extra_tax: number;
  further_tax: number;
  arrears: number;
  current_bill: number;
  bill_adjustment: number;
  installment: number;
  subsidies: number;
  payable_within_due_date: number;
  payable_after_due_date: number;
  lp_surcharge: number;
  division: string;
  sub_division: string;
  feeder_name: string;
  historical_bills: Array<{
    month: string;
    units: number;
    bill: number;
    payment: number;
  }>;
  raw_html_hash: string;
}

export type IescoErrorCode =
  | "INVALID_REFERENCE"
  | "NETWORK_ERROR"
  | "PARSING_FAILED"
  | "RATE_LIMITED"
  | "NOT_FOUND";

export class IescoScraperError extends Error {
  constructor(
    public code: IescoErrorCode,
    message: string,
    public statusCode?: number,
    public debugHint?: string
  ) {
    super(message);
    this.name = "IescoScraperError";
  }
}

export function normalizeReferenceNumber(raw: string): string {
  const cleaned = (raw ?? "").replace(/\s+/g, "").toUpperCase();
  const withoutCheck = cleaned.replace(/[A-Z]$/, "");
  if (!/^\d{14}$/.test(withoutCheck)) {
    throw new IescoScraperError(
      "INVALID_REFERENCE",
      "Reference number must be 14 digits (optionally with a trailing check letter)."
    );
  }
  return withoutCheck;
}

function parseNum(text: string | undefined | null): number {
  if (!text) return 0;
  const cleaned = text.replace(/[,\s]/g, "").trim();
  if (!cleaned) return 0;
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function cleanText($el: any): string {
  return String($el.text() ?? "").replace(/\s+/g, " ").trim();
}

const BASE_HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,ur;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
};

// Look like a browser that already loaded the IESCO form once.
function isBillHtml(html: string): boolean {
  return html.includes("CONSUMER ID") && html.includes("REFERENCE NO");
}

async function fetchGetBill(normalized: string): Promise<string | null> {
  const url = `${IESCO_BASE_URL}?refno=${normalized}`;
  let response: Response;
  try {
    response = await fetch(url, { headers: BASE_HEADERS, redirect: "follow", signal: AbortSignal.timeout(15000) });
  } catch (err: any) {
    console.error("[iesco] GET fetch failed:", err?.name, err?.message);
    if (err?.name === "AbortError" || err?.name === "TimeoutError") {
      throw new IescoScraperError("NETWORK_ERROR", "IESCO server did not respond in time. Please try again.", 504, "GET timeout");
    }
    throw new IescoScraperError("NETWORK_ERROR", `Could not reach IESCO server: ${err?.message ?? "unknown"}`, 503, `GET ${err?.name ?? "err"}`);
  }
  if (response.status === 429) {
    console.error("[iesco] GET 429 rate-limited");
    throw new IescoScraperError("RATE_LIMITED", "Too many requests to IESCO. Please wait a moment.", 429, "GET 429");
  }
  if (!response.ok) {
    console.error("[iesco] GET not-ok:", response.status);
    return null;
  }
  const html = await response.text();
  const ok = isBillHtml(html);
  if (!ok) {
    console.error("[iesco] GET non-bill HTML:", html.length, "bytes, first100:", html.slice(0, 100).replace(/\s+/g, " "));
  }
  return ok ? html : null;
}

// Current IESCO portal uses ASP.NET WebForms — emulate the browser POST-back.
async function fetchPostbackBill(normalized: string): Promise<string> {
  const landingUrl = "https://bill.pitc.com.pk/iescobill";
  let landing: Response;
  try {
    landing = await fetch(landingUrl, { headers: BASE_HEADERS, redirect: "follow", signal: AbortSignal.timeout(15000) });
  } catch (err: any) {
    if (err?.name === "AbortError" || err?.name === "TimeoutError") {
      throw new IescoScraperError("NETWORK_ERROR", "IESCO server did not respond in time. Please try again.", 504);
    }
    throw new IescoScraperError("NETWORK_ERROR", `Could not reach IESCO landing: ${err?.message ?? "unknown"}`, 503);
  }
  if (!landing.ok) throw new IescoScraperError("NETWORK_ERROR", `IESCO landing returned HTTP ${landing.status}`, landing.status);

  const landingHtml = await landing.text();
  const $ = cheerio.load(landingHtml);

  const viewState = $("input[name=__VIEWSTATE]").attr("value") ?? "";
  const viewStateGen = $("input[name=__VIEWSTATEGENERATOR]").attr("value") ?? "";
  const eventValidation = $("input[name=__EVENTVALIDATION]").attr("value") ?? "";
  const rvt = $("input[name=__RequestVerificationToken]").attr("value") ?? "";

  if (!viewState || !eventValidation) {
    throw new IescoScraperError("PARSING_FAILED", "IESCO landing page missing expected form tokens.");
  }

  // Stitch cookies from the Set-Cookie header into a single Cookie header for the POST.
  const setCookie = landing.headers.get("set-cookie") ?? "";
  const cookieHeader = setCookie
    .split(/,(?=[^,;]+?=)/) // split on commas separating multiple cookies
    .map((c) => c.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");

  const body = new URLSearchParams();
  body.set("__EVENTTARGET", "");
  body.set("__EVENTARGUMENT", "");
  body.set("__LASTFOCUS", "");
  body.set("__VIEWSTATE", viewState);
  body.set("__VIEWSTATEGENERATOR", viewStateGen);
  body.set("__EVENTVALIDATION", eventValidation);
  if (rvt) body.set("__RequestVerificationToken", rvt);
  body.set("rbSearchByList", "refno");
  body.set("searchTextBox", normalized);
  body.set("ruCodeTextBox", "");
  body.set("btnSearch", "Search");

  let submitted: Response;
  try {
    submitted = await fetch(landingUrl, {
      method: "POST",
      headers: {
        ...BASE_HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: landingUrl,
        Origin: "https://bill.pitc.com.pk",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: body.toString(),
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
  } catch (err: any) {
    console.error("[iesco] POST fetch failed:", err?.name, err?.message);
    if (err?.name === "AbortError" || err?.name === "TimeoutError") {
      throw new IescoScraperError("NETWORK_ERROR", "IESCO server did not respond in time. Please try again.", 504, "POST timeout");
    }
    throw new IescoScraperError("NETWORK_ERROR", `Could not submit to IESCO: ${err?.message ?? "unknown"}`, 503, `POST ${err?.name ?? "err"}`);
  }

  if (submitted.status === 429) {
    console.error("[iesco] POST 429 rate-limited");
    throw new IescoScraperError("RATE_LIMITED", "Too many requests to IESCO. Please wait a moment.", 429, "POST 429");
  }
  if (!submitted.ok) {
    console.error("[iesco] POST not-ok:", submitted.status);
    throw new IescoScraperError("NETWORK_ERROR", `IESCO returned HTTP ${submitted.status}`, submitted.status, `POST HTTP ${submitted.status}`);
  }
  const html = await submitted.text();
  if (!isBillHtml(html)) {
    console.error(
      "[iesco] POST non-bill HTML:",
      html.length,
      "bytes, first150:",
      html.slice(0, 150).replace(/\s+/g, " ")
    );
    throw new IescoScraperError(
      "NOT_FOUND",
      "Reference number not found on IESCO portal.",
      404,
      `POST non-bill ${html.length}B`
    );
  }
  return html;
}

export async function scrapeIescoBill(referenceNumber: string): Promise<ScrapedBill> {
  const normalized = normalizeReferenceNumber(referenceNumber);

  // 1) Fast path: legacy GET route (may work for some refs).
  let html: string | null = await fetchGetBill(normalized);

  // 2) Fallback: ASP.NET WebForms postback (current portal flow).
  if (!html) html = await fetchPostbackBill(normalized);

  const $ = cheerio.load(html);

  try {
    // Header-label-based column mapping. Handles rowspan/colspan variations
    // that used to break the previous fixed-index approach.
    let connected_load = "";
    let bill_month = "";
    let reading_date = "";
    let issue_date = "";
    let due_date = "";
    let connection_date = "";

    $("table.maintable").first().find("tr").each((_: number, tr: any) => {
      const $tr = $(tr);
      const headers = $tr.find("h4").map((__: number, h: any) => cleanText($(h)).toUpperCase()).get();
      const looksLikeHeaderRow =
        headers.some((h: string) => h.includes("BILL MONTH")) &&
        headers.some((h: string) => h.includes("READING DATE"));
      if (!looksLikeHeaderRow) return;

      const labelToIndex: Record<string, number> = {};
      $tr.find("td").each((i: number, td: any) => {
        const label = cleanText($(td).find("h4").first()).toUpperCase();
        if (label) labelToIndex[label] = i;
      });

      const valueRow = $tr.nextAll("tr.content").first();
      const valueCells = valueRow.find("td");
      const getVal = (label: string): string => {
        const idx = labelToIndex[label];
        if (idx === undefined) return "";
        return cleanText(valueCells.eq(idx));
      };

      connection_date = getVal("CONNECTION DATE");
      connected_load = getVal("CONNECTED LOAD");
      bill_month = getVal("BILL MONTH");
      reading_date = getVal("READING DATE");
      issue_date = getVal("ISSUE DATE");
      due_date = getVal("DUE DATE");
    });

    // Regex fallback if DOM-based extraction came up short.
    if (!reading_date) {
      const m = html.match(/READING DATE[^0-9]*(\d{1,2}\s+[A-Z]{3}\s+\d{2,4})/i);
      if (m) reading_date = m[1];
    }
    if (!issue_date) {
      const m = html.match(/ISSUE DATE[^0-9]*(\d{1,2}\s+[A-Z]{3}\s+\d{2,4})/i);
      if (m) issue_date = m[1];
    }
    if (!due_date) {
      const m = html.match(/DUE DATE[^0-9]*(\d{1,2}\s+[A-Z]{3}\s+\d{2,4})/i);
      if (m) due_date = m[1];
    }
    if (!bill_month) {
      const m = html.match(/BILL MONTH[^A-Z]*([A-Z]{3}\s+\d{2,4})/i);
      if (m) bill_month = m[1];
    }
    if (!connection_date) {
      const m = html.match(/CONNECTION DATE[^0-9]*(\d{1,2}\s+[A-Z]{3}\s+\d{2,4})/i);
      if (m) connection_date = m[1];
    }

    const nestable1Rows = $("table.nestable1 tr.content");
    const consumer_id = cleanText(nestable1Rows.eq(0).find("td").eq(0));
    const tariff = cleanText(nestable1Rows.eq(0).find("td").eq(1));
    const reference_number = cleanText(nestable1Rows.eq(1).find("td").eq(0));

    let division = "";
    let sub_division = "";
    let feeder_name = "";
    $("table").each((_: number, tbl: any) => {
      $(tbl).find("tr").each((__: number, tr: any) => {
        const label = cleanText($(tr).find("h4").first());
        if (label === "DIVISION" && !division) division = cleanText($(tr).find("td.content").first());
        else if (label === "SUB DIVISION" && !sub_division) sub_division = cleanText($(tr).find("td.content").first());
        else if (label === "FEEDER NAME" && !feeder_name) feeder_name = cleanText($(tr).find("td.content").first());
      });
    });

    const nameBlock = $("table.nested4 p").first();
    const nameLines = nameBlock.text().split("\n").map((l: string) => l.trim()).filter((l: string) => l && l !== "NAME & ADDRESS");
    const customer_name = nameLines[0] || "";

    let meter_number = "";
    let previous_reading = 0;
    let present_reading = 0;
    let multiplying_factor = 1;
    let units_billed = 0;
    $("table.nested4 tr").each((_: number, tr: any) => {
      const headers = $(tr).find("h4").map((__: number, h: any) => cleanText($(h))).get();
      if (headers.includes("METER NO") && headers.includes("UNITS")) {
        const readingRow = $(tr).next("tr.content");
        if (readingRow.length) {
          const cells = readingRow.find("td");
          meter_number = cleanText(cells.eq(0));
          previous_reading = parseNum(cleanText(cells.eq(1)));
          present_reading = parseNum(cleanText(cells.eq(2)));
          multiplying_factor = parseNum(cleanText(cells.eq(3))) || 1;
          units_billed = parseNum(cleanText(cells.eq(4)));
        }
      }
    });

    const historical_bills: Array<{ month: string; units: number; bill: number; payment: number }> = [];
    $("table.nested6 tr.content").each((_: number, tr: any) => {
      const cells = $(tr).find("td");
      if (cells.length >= 4) {
        const month = cleanText(cells.eq(0));
        if (month) {
          historical_bills.push({
            month,
            units: parseNum(cleanText(cells.eq(1))),
            bill: parseNum(cleanText(cells.eq(2))),
            payment: parseNum(cleanText(cells.eq(3))),
          });
        }
      }
    });

    const chargesMap: Record<string, number> = {};
    $("table.nested7 tr").each((_: number, tr: any) => {
      const $tr = $(tr);
      $tr.find("td b").each((__: number, b: any) => {
        const label = cleanText($(b)).toUpperCase();
        const labelCell = $(b).closest("td");
        const valueCell = labelCell.nextAll("td.content").first();
        if (label && valueCell.length) {
          const val = parseNum(cleanText(valueCell));
          if (!(label in chargesMap)) chargesMap[label] = val;
        }
      });
    });

    const findChargeByLabel = (labelText: string): number => {
      let result = 0;
      $("b").each((_: number, b: any) => {
        const text = cleanText($(b)).toUpperCase();
        if (text === labelText.toUpperCase()) {
          const contentCell = $(b).closest("td").nextAll("td.content, td.nestedtd2width.content").first();
          if (contentCell.length) {
            const v = parseNum(cleanText(contentCell));
            if (v > 0 || result === 0) result = v;
          }
        }
      });
      return result;
    };

    let payable_within_due_date = 0;
    let payable_after_due_date = 0;
    $("*").each((_: number, el: any) => {
      const text = cleanText($(el));
      if (text === "PAYABLE WITHIN DUE DATE") {
        const parentRow = $(el).closest("tr");
        const amtCell = parentRow.find("td.content").first();
        if (!payable_within_due_date) payable_within_due_date = parseNum(cleanText(amtCell));
      }
    });

    const lpBlock = cleanText(
      $("td.nestedtd2width.content")
        .filter((_: number, el: any) => {
          const t = cleanText($(el));
          return t.includes("Till") && t.includes("After");
        })
        .first()
    );
    const lpMatch = lpBlock.match(/(\d+)\s+Till[^0-9]+\d{2}-[A-Z]+-\d{2}\s+(\d+)\s+(\d+)\s+After[^0-9]+\d{2}-[A-Z]+-\d{2}\s+(\d+)/);
    let lp_surcharge = 0;
    if (lpMatch) {
      lp_surcharge = parseNum(lpMatch[1]);
      payable_after_due_date = parseNum(lpMatch[4]);
    }

    const raw_html_hash = createHash("sha256").update(html).digest("hex").slice(0, 16);

    const result: ScrapedBill = {
      reference_number,
      consumer_id,
      customer_name,
      tariff,
      bill_month,
      issue_date,
      due_date,
      reading_date,
      connection_date,
      connected_load,
      meter_number,
      previous_reading,
      present_reading,
      multiplying_factor,
      units_billed,
      cost_of_electricity: chargesMap["COST OF ELECTRICITY"] || 0,
      fixed_charges: chargesMap["FIX CHARGES"] || chargesMap["METER RENT"] || 0,
      fuel_price_adjustment: chargesMap["FUEL PRICE ADJUSTMENT"] || 0,
      total_fpa: findChargeByLabel("TOTAL FPA"),
      fc_surcharge: chargesMap["F.C SURCHARGE"] || 0,
      qtr_tariff_adjustment: chargesMap["QTR TARRIF ADJ/DMC"] || 0,
      electricity_duty: chargesMap["ELECTRICITY DUTY"] || 0,
      gst: chargesMap["GST"] || 0,
      income_tax: chargesMap["INCOME TAX"] || 0,
      extra_tax: chargesMap["EXTRA TAX"] || 0,
      further_tax: chargesMap["FURTHER TAX"] || 0,
      arrears: findChargeByLabel("ARREAR/AGE"),
      current_bill: findChargeByLabel("CURRENT BILL"),
      bill_adjustment: findChargeByLabel("BILL ADJUSTMENT"),
      installment: findChargeByLabel("INSTALLEMENT"),
      subsidies: findChargeByLabel("SUBSIDIES"),
      payable_within_due_date,
      payable_after_due_date,
      lp_surcharge,
      division,
      sub_division,
      feeder_name,
      historical_bills,
      raw_html_hash,
    };

    if (result.units_billed === 0 && result.payable_within_due_date === 0) {
      throw new IescoScraperError("PARSING_FAILED", "Scraper could not extract bill data. IESCO page format may have changed.");
    }

    return result;
  } catch (err: any) {
    if (err instanceof IescoScraperError) throw err;
    throw new IescoScraperError("PARSING_FAILED", `Parse error: ${err?.message ?? "unknown"}`);
  }
}
