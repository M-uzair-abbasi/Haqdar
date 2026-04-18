import { Bill, OverchargeResult } from "@/types";
import { detectExtendedCycle } from "./rule1_extended_cycle";
import { detectSlabAbuse } from "./rule2_slab_abuse";
import { detectFPAOnLifeline } from "./rule3_fpa_lifeline";
import { detectChainedEstimates } from "./rule4_chained_estimates";
import { detectPUGCharges } from "./rule5_pug_charges";

export function runAllDetections(bill: Bill): OverchargeResult[] {
  const rules = [
    detectExtendedCycle,
    detectSlabAbuse,
    detectFPAOnLifeline,
    detectChainedEstimates,
    detectPUGCharges,
  ];
  const results: OverchargeResult[] = [];
  for (const rule of rules) {
    const result = rule(bill);
    if (result) results.push(result);
  }
  return results;
}

export function getTotalOvercharge(results: OverchargeResult[]): number {
  return results.reduce((sum, r) => sum + r.overcharge_amount, 0);
}
