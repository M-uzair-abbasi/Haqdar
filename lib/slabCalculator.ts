import { KE_DOMESTIC_SLABS, SlabTier } from "./slabs";

function getSlabsForDisco(_disco: string, _tariff: string): SlabTier[] {
  return KE_DOMESTIC_SLABS;
}

export function calculateSlabAmount(
  units: number,
  tariffCategory: string,
  discoName: string
): number {
  const slabs = getSlabsForDisco(discoName, tariffCategory);
  let total = 0;
  let remainingUnits = units;

  for (const slab of slabs) {
    if (remainingUnits <= 0) break;
    const slabWidth = slab.max === Infinity ? remainingUnits : slab.max - slab.min + 1;
    const unitsInThisSlab = Math.min(remainingUnits, slabWidth);
    total += unitsInThisSlab * slab.rate;
    remainingUnits -= unitsInThisSlab;
  }

  // Add approximation for standard surcharges (FPA ~5%, taxes ~5%, TV license ~2%, etc.)
  total = total * 1.15;

  return Math.round(total);
}

export function dayDiff(fromISO: string, toISO: string): number {
  const from = new Date(fromISO).getTime();
  const to = new Date(toISO).getTime();
  return Math.max(1, Math.round((to - from) / (1000 * 60 * 60 * 24)));
}
