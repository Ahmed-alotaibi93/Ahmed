import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/errors.js";
import { roadDistanceKm } from "./distance.js";
import { calculatePrice, type PriceBreakdown } from "./pricing.js";

export const MAX_DISTANCE_KM = 250;
export const MIN_LEAD_MINUTES = 60;

export interface QuoteInput {
  airportId: number;
  lat: number;
  lng: number;
  pickupAt: Date;
}

export interface QuoteOption {
  vehicleClassId: number;
  code: string;
  nameAr: string;
  nameEn: string;
  seats: number;
  bags: number;
  price: PriceBreakdown;
}

export async function buildQuote(input: QuoteInput) {
  const airport = await prisma.airport.findFirst({ where: { id: input.airportId, active: true } });
  if (!airport) throw new HttpError(404, "AIRPORT_NOT_FOUND");

  if (input.pickupAt.getTime() < Date.now() + MIN_LEAD_MINUTES * 60_000) {
    throw new HttpError(400, "PICKUP_TOO_SOON", `Pickup must be at least ${MIN_LEAD_MINUTES} minutes from now`);
  }

  const { km, source } = await roadDistanceKm({ lat: input.lat, lng: input.lng }, airport);
  if (km > MAX_DISTANCE_KM) {
    throw new HttpError(400, "DISTANCE_TOO_FAR", `Address is more than ${MAX_DISTANCE_KM} km from the airport`);
  }

  const classes = await prisma.vehicleClass.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  const options: QuoteOption[] = classes.map((c) => ({
    vehicleClassId: c.id,
    code: c.code,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    seats: c.seats,
    bags: c.bags,
    price: calculatePrice(c, km, input.pickupAt),
  }));

  return { airport, distanceKm: km, distanceSource: source, options };
}
