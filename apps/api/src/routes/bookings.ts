import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/errors.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";
import { buildQuote } from "../services/quote.js";
import { quoteSchema } from "./catalog.js";

export const bookingsRouter = Router();
bookingsRouter.use(requireAuth);

export const CANCEL_CUTOFF_MS = 2 * 60 * 60_000;
const CANCELLABLE = ["PENDING", "CONFIRMED"];

const createSchema = quoteSchema
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

const include = { airport: true, vehicleClass: true } as const;

bookingsRouter.post("/", async (req: AuthedRequest, res) => {
  const body = createSchema.parse(req.body);
  const quote = await buildQuote(body);
  const option = quote.options.find((o) => o.vehicleClassId === body.vehicleClassId);
  if (!option) throw new HttpError(400, "VEHICLE_CLASS_NOT_FOUND");
  if (body.passengers > option.seats) throw new HttpError(400, "TOO_MANY_PASSENGERS");
  if (body.bags > option.bags) throw new HttpError(400, "TOO_MANY_BAGS");

  const booking = await prisma.booking.create({
    data: {
      userId: req.userId!,
      airportId: body.airportId,
      vehicleClassId: body.vehicleClassId,
      direction: body.direction,
      address: body.address,
      lat: body.lat,
      lng: body.lng,
      pickupAt: body.pickupAt,
      flightNumber: body.flightNumber,
      passengers: body.passengers,
      bags: body.bags,
      notes: body.notes,
      distanceKm: quote.distanceKm,
      price: option.price.total,
    },
    include,
  });
  res.status(201).json({ booking, price: option.price });
});

bookingsRouter.get("/", async (req: AuthedRequest, res) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.userId },
    orderBy: { pickupAt: "desc" },
    include,
  });
  res.json({ bookings });
});

async function findOwn(req: AuthedRequest) {
  const id = z.coerce.number().int().parse(req.params.id);
  const booking = await prisma.booking.findFirst({ where: { id, userId: req.userId }, include });
  if (!booking) throw new HttpError(404, "BOOKING_NOT_FOUND");
  return booking;
}

bookingsRouter.get("/:id", async (req: AuthedRequest, res) => {
  res.json({ booking: await findOwn(req) });
});

bookingsRouter.post("/:id/cancel", async (req: AuthedRequest, res) => {
  const booking = await findOwn(req);
  if (!CANCELLABLE.includes(booking.status)) throw new HttpError(400, "NOT_CANCELLABLE");
  if (booking.pickupAt.getTime() - Date.now() < CANCEL_CUTOFF_MS) throw new HttpError(400, "CANCEL_TOO_LATE");
  const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" }, include });
  res.json({ booking: updated });
});
