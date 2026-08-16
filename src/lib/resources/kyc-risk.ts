/** Spec 01: riskBand is derived from riskScore. 0–39 low, 40–69 medium, 70–100 high. */
export type KycRiskBand = "low" | "medium" | "high";

export function riskBandFor(riskScore: number): KycRiskBand {
  if (riskScore >= 70) return "high";
  if (riskScore >= 40) return "medium";
  return "low";
}
