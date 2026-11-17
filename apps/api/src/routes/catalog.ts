import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { buildQuote } from "../services/quote.js";
import { searchPlaces } from "../services/places.js";

export const catalogRouter = Router();

catalogRouter.get("/airports", async (_req, res) => {
  const airports = await prisma.airport.findMany({ where: { active: true }, orderBy: { id: "asc" } });
  res.json({ airports });
});

catalogRouter.get("/vehicle-classes", async (_req, res) => {
  const vehicleClasses = await prisma.vehicleClass.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  res.json({ vehicleClasses });
});

export const quoteSchema = z.object({
  airportId: z.coerce.number().int().positive(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  pickupAt: z.coerce.date(),
});

catalogRouter.post("/quotes", async (req, res) => {
  const input = quoteSchema.parse(req.body);
  res.json(await buildQuote(input));
});

catalogRouter.get("/places/search", async (req, res) => {
  const q = z
    .object({
      q: z.string().trim().min(2).max(120),
      lat: z.coerce.number().optional(),
      lng: z.coerce.number().optional(),
      lang: z.enum(["ar", "en"]).default("ar"),
    })
    .parse(req.query);
  const near = q.lat !== undefined && q.lng !== undefined ? { lat: q.lat, lng: q.lng } : undefined;
  try {
    res.json({ places: await searchPlaces(q.q, near, q.lang) });
  } catch (e) {
    console.warn("Place search failed", e);
    res.status(502).json({ error: "PLACES_UNAVAILABLE" });
  }
});
