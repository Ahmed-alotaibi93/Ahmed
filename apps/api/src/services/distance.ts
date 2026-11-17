import { config } from "../lib/config.js";

export interface LatLng {
  lat: number;
  lng: number;
}

/** معامل تقريبي لتحويل المسافة المستقيمة إلى مسافة طريق */
export const ROAD_FACTOR = 1.3;

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function estimateRoadKm(a: LatLng, b: LatLng): number {
  return round1(haversineKm(a, b) * ROAD_FACTOR);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/**
 * مسافة الطريق بالكيلومتر. يستخدم Google Distance Matrix إذا توفر المفتاح،
 * وإلا (أو عند الفشل) يرجع للتقدير بمعادلة Haversine.
 */
export async function roadDistanceKm(
  from: LatLng,
  to: LatLng,
): Promise<{ km: number; source: "google" | "estimate" }> {
  if (config.googleMapsKey) {
    try {
      const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
      url.searchParams.set("origins", `${from.lat},${from.lng}`);
      url.searchParams.set("destinations", `${to.lat},${to.lng}`);
      url.searchParams.set("units", "metric");
      url.searchParams.set("key", config.googleMapsKey);
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const data = (await res.json()) as {
        rows?: { elements?: { status: string; distance?: { value: number } }[] }[];
      };
      const el = data.rows?.[0]?.elements?.[0];
      if (el?.status === "OK" && el.distance) {
        return { km: round1(el.distance.value / 1000), source: "google" };
      }
    } catch (e) {
      console.warn("Google Distance Matrix failed, falling back to estimate", e);
    }
  }
  return { km: estimateRoadKm(from, to), source: "estimate" };
}
