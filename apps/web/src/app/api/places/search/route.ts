import { z } from "zod";
import { json, options, route } from "@/server/http";
import { searchPlaces } from "@/server/places";

export const OPTIONS = options;
export const GET = route(async (req) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const q = z
    .object({
      q: z.string().trim().min(2).max(120),
      lat: z.coerce.number().optional(),
      lng: z.coerce.number().optional(),
      lang: z.enum(["ar", "en"]).default("ar"),
    })
    .parse(params);
  const near = q.lat !== undefined && q.lng !== undefined ? { lat: q.lat, lng: q.lng } : undefined;
  try {
    return json({ places: await searchPlaces(q.q, near, q.lang) });
  } catch (e) {
    console.warn("Place search failed", e);
    return json({ error: "PLACES_UNAVAILABLE" }, 502);
  }
});
