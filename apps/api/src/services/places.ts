import { config } from "../lib/config.js";

export interface Place {
  label: string;
  lat: number;
  lng: number;
}

const cache = new Map<string, { at: number; places: Place[] }>();
const CACHE_MS = 10 * 60_000;

/**
 * بحث العناوين داخل السعودية. Google Places إذا توفر المفتاح، وإلا OpenStreetMap (Nominatim).
 * ملاحظة: Nominatim مناسب للتطوير والحجم القليل فقط — للإنتاج استخدم مفتاح Google.
 */
export async function searchPlaces(query: string, near?: { lat: number; lng: number }, lang = "ar"): Promise<Place[]> {
  const key = `${lang}|${query}|${near?.lat.toFixed(2)},${near?.lng.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.places;

  const places = config.googleMapsKey ? await google(query, near, lang) : await nominatim(query, near, lang);
  cache.set(key, { at: Date.now(), places });
  return places;
}

async function google(query: string, near: { lat: number; lng: number } | undefined, lang: string) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("region", "sa");
  url.searchParams.set("language", lang);
  if (near) {
    url.searchParams.set("location", `${near.lat},${near.lng}`);
    url.searchParams.set("radius", "60000");
  }
  url.searchParams.set("key", config.googleMapsKey!);
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  const data = (await res.json()) as {
    results?: { name: string; formatted_address: string; geometry: { location: { lat: number; lng: number } } }[];
  };
  return (data.results ?? []).slice(0, 8).map((r) => ({
    label: `${r.name} — ${r.formatted_address}`,
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
  }));
}

async function nominatim(query: string, near: { lat: number; lng: number } | undefined, lang: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "sa");
  url.searchParams.set("limit", "8");
  url.searchParams.set("accept-language", lang);
  if (near) {
    const d = 0.6;
    url.searchParams.set("viewbox", `${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}`);
  }
  const res = await fetch(url, {
    headers: { "User-Agent": "airport-ride-app/1.0" },
    signal: AbortSignal.timeout(6000),
  });
  const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  return data.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }));
}
