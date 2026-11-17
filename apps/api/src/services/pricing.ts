export interface FareRule {
  baseFare: number;
  perKm: number;
  minFare: number;
}

export const NIGHT_MULTIPLIER = 1.15;
/** السعودية UTC+3 بدون توقيت صيفي */
const KSA_OFFSET_HOURS = 3;

export function isNightTime(pickupAt: Date): boolean {
  const hour = (pickupAt.getUTCHours() + KSA_OFFSET_HOURS) % 24;
  return hour >= 0 && hour < 5;
}

export interface PriceBreakdown {
  baseFare: number;
  distanceFare: number;
  minFareApplied: boolean;
  nightSurcharge: number;
  total: number;
}

export function calculatePrice(rule: FareRule, distanceKm: number, pickupAt: Date): PriceBreakdown {
  const distanceFare = round2(distanceKm * rule.perKm);
  let subtotal = rule.baseFare + distanceFare;
  const minFareApplied = subtotal < rule.minFare;
  if (minFareApplied) subtotal = rule.minFare;
  const nightSurcharge = isNightTime(pickupAt) ? round2(subtotal * (NIGHT_MULTIPLIER - 1)) : 0;
  return {
    baseFare: rule.baseFare,
    distanceFare,
    minFareApplied,
    nightSurcharge,
    total: Math.round(subtotal + nightSurcharge),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
