export interface SlabTier {
  min: number;
  max: number;
  rate: number;
  label: string;
}

export const KE_DOMESTIC_SLABS: SlabTier[] = [
  { min: 1, max: 50, rate: 3.95, label: "Lifeline" },
  { min: 51, max: 100, rate: 7.74, label: "Protected 51-100" },
  { min: 101, max: 200, rate: 10.06, label: "Protected 101-200" },
  { min: 201, max: 300, rate: 27.14, label: "Unprotected 201-300" },
  { min: 301, max: 400, rate: 32.03, label: "Unprotected 301-400" },
  { min: 401, max: 500, rate: 35.24, label: "Unprotected 401-500" },
  { min: 501, max: 600, rate: 37.31, label: "Unprotected 501-600" },
  { min: 601, max: 700, rate: 43.33, label: "Unprotected 601-700" },
  { min: 701, max: Infinity, rate: 48.84, label: "Unprotected 701+" },
];

export const LESCO_DOMESTIC_SLABS: SlabTier[] = KE_DOMESTIC_SLABS;

export const DISCO_LIST = [
  { id: "K-Electric", name: "K-Electric", region: "Karachi", type: "electricity" },
  { id: "LESCO", name: "LESCO", region: "Lahore", type: "electricity" },
  { id: "IESCO", name: "IESCO", region: "Islamabad", type: "electricity" },
  { id: "MEPCO", name: "MEPCO", region: "Multan", type: "electricity" },
  { id: "GEPCO", name: "GEPCO", region: "Gujranwala", type: "electricity" },
  { id: "HESCO", name: "HESCO", region: "Hyderabad", type: "electricity" },
  { id: "PESCO", name: "PESCO", region: "Peshawar", type: "electricity" },
  { id: "FESCO", name: "FESCO", region: "Faisalabad", type: "electricity" },
  { id: "SNGPL", name: "SNGPL", region: "Gas - North", type: "gas" },
  { id: "SSGC", name: "SSGC", region: "Gas - South", type: "gas" },
] as const;

export const TARIFF_CATEGORIES = [
  { id: "lifeline", label: "Lifeline (1-50 units)", englishLabel: "Lifeline", urduLabel: "لائف لائن" },
  { id: "protected_domestic", label: "Protected Domestic (51-200 units)", englishLabel: "Protected", urduLabel: "محفوظ گھریلو" },
  { id: "unprotected_domestic", label: "Unprotected Domestic (201+ units)", englishLabel: "Unprotected", urduLabel: "غیر محفوظ گھریلو" },
  { id: "commercial_a2", label: "Commercial A2", englishLabel: "Commercial", urduLabel: "تجارتی" },
  { id: "industrial_a3", label: "Industrial A3", englishLabel: "Industrial", urduLabel: "صنعتی" },
] as const;

export const READING_TYPES = [
  { id: "actual", englishLabel: "Actual physical reading", urduLabel: "اصل میٹر ریڈنگ" },
  { id: "estimated", englishLabel: "Estimated (marked 'E' on bill)", urduLabel: "تخمینہ (بل پر 'E')" },
  { id: "chained_estimated", englishLabel: "Last 3+ bills all estimated", urduLabel: "پچھلے 3 یا زیادہ بل اندازے پر" },
] as const;
