import { describe, expect, it } from "vitest";
import { calculatePrice, isNightTime } from "@/server/pricing";
import { estimateRoadKm, haversineKm } from "@/server/distance";
import { normalizeSaudiPhone } from "@/server/auth";

const rule = { baseFare: 25, perKm: 1.6, minFare: 50 };
const dayTime = new Date("2026-12-01T09:00:00Z"); // 12:00 KSA
const nightTime = new Date("2026-12-01T23:30:00Z"); // 02:30 KSA

describe("pricing", () => {
  it("charges base + distance", () => {
    const p = calculatePrice(rule, 40, dayTime);
    expect(p.total).toBe(89); // 25 + 64
    expect(p.minFareApplied).toBe(false);
    expect(p.nightSurcharge).toBe(0);
  });

  it("applies minimum fare for short trips", () => {
    const p = calculatePrice(rule, 5, dayTime);
    expect(p.total).toBe(50);
    expect(p.minFareApplied).toBe(true);
  });

  it("adds 15% between midnight and 5am Saudi time", () => {
    expect(isNightTime(nightTime)).toBe(true);
    expect(isNightTime(dayTime)).toBe(false);
    const p = calculatePrice(rule, 40, nightTime);
    expect(p.total).toBe(Math.round(89 * 1.15));
  });
});

describe("distance", () => {
  it("computes Riyadh centre to RUH roughly", () => {
    const olaya = { lat: 24.6907, lng: 46.6853 };
    const ruh = { lat: 24.9576, lng: 46.6988 };
    expect(haversineKm(olaya, ruh)).toBeGreaterThan(29);
    expect(haversineKm(olaya, ruh)).toBeLessThan(31);
    expect(estimateRoadKm(olaya, ruh)).toBeCloseTo(haversineKm(olaya, ruh) * 1.3, 0);
  });
});

describe("phone", () => {
  it("normalizes Saudi numbers", () => {
    expect(normalizeSaudiPhone("0501234567")).toBe("+966501234567");
    expect(normalizeSaudiPhone("+966 50 123 4567")).toBe("+966501234567");
    expect(normalizeSaudiPhone("501234567")).toBe("+966501234567");
    expect(normalizeSaudiPhone("0401234567")).toBeNull();
  });
});
