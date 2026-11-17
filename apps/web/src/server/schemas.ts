import { z } from "zod";
import { normalizeSaudiPhone } from "./auth";

export const phoneSchema = z.string().transform((v, ctx) => {
  const p = normalizeSaudiPhone(v);
  if (!p) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid Saudi mobile number" });
    return z.NEVER;
  }
  return p;
});

export const quoteSchema = z.object({
  airportId: z.coerce.number().int().positive(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  pickupAt: z.coerce.date(),
});

export const createBookingSchema = quoteSchema
  .extend({
    direction: z.enum(["TO_AIRPORT", "FROM_AIRPORT"]),
    address: z.string().trim().min(3).max(300),
    vehicleClassId: z.coerce.number().int().positive(),
    flightNumber: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{2}\s?\d{1,4}[A-Z]?$/, "Invalid flight number")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    passengers: z.coerce.number().int().min(1).max(20),
    bags: z.coerce.number().int().min(0).max(30),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((b) => b.direction !== "FROM_AIRPORT" || !!b.flightNumber, {
    message: "Flight number is required for airport pickups",
    path: ["flightNumber"],
  });
