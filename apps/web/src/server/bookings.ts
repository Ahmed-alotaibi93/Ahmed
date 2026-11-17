import { randomInt } from "node:crypto";
import type { z } from "zod";
import { prisma } from "./prisma";
import { HttpError } from "./errors";
import { buildQuote } from "./quote";
import type { createBookingSchema } from "./schemas";

export const CANCEL_CUTOFF_MS = 2 * 60 * 60_000;
const CANCELLABLE = ["PENDING", "CONFIRMED"];
const OTP_TTL_MS = 5 * 60_000;
const MAX_OTP_ATTEMPTS = 5;
export const bookingInclude = { airport: true, vehicleClass: true } as const;

export async function issueOtp(phone: string) {
  const code = String(randomInt(100000, 1000000));
  await prisma.otpCode.updateMany({ where: { phone, used: false }, data: { used: true } });
  await prisma.otpCode.create({ data: { phone, code, expiresAt: new Date(Date.now() + OTP_TTL_MS) } });
  // TODO: ربط مزود SMS (Unifonic / Twilio). حالياً يطبع الرمز في السجل.
  console.log(`[OTP] ${phone}: ${code}`);
  return code;
}

export async function verifyOtp(phone: string, code: string) {
  const otp = await prisma.otpCode.findFirst({
    where: { phone, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.attempts >= MAX_OTP_ATTEMPTS) throw new HttpError(400, "OTP_EXPIRED");
  if (otp.code !== code) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new HttpError(400, "OTP_INVALID");
  }
  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
  return prisma.user.upsert({ where: { phone }, update: {}, create: { phone } });
}

export async function createBooking(userId: number, body: z.infer<typeof createBookingSchema>) {
  // السعر يُحسب هنا دائماً — ما نعتمد على سعر يرسله العميل
  const quote = await buildQuote(body);
  const option = quote.options.find((o) => o.vehicleClassId === body.vehicleClassId);
  if (!option) throw new HttpError(400, "VEHICLE_CLASS_NOT_FOUND");
  if (body.passengers > option.seats) throw new HttpError(400, "TOO_MANY_PASSENGERS");
  if (body.bags > option.bags) throw new HttpError(400, "TOO_MANY_BAGS");

  const booking = await prisma.booking.create({
    data: {
      userId,
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
    include: bookingInclude,
  });
  return { booking, price: option.price };
}

export async function findOwnBooking(userId: number, id: number) {
  const booking = await prisma.booking.findFirst({ where: { id, userId }, include: bookingInclude });
  if (!booking) throw new HttpError(404, "BOOKING_NOT_FOUND");
  return booking;
}

export async function cancelBooking(userId: number, id: number) {
  const booking = await findOwnBooking(userId, id);
  if (!CANCELLABLE.includes(booking.status)) throw new HttpError(400, "NOT_CANCELLABLE");
  if (booking.pickupAt.getTime() - Date.now() < CANCEL_CUTOFF_MS) throw new HttpError(400, "CANCEL_TOO_LATE");
  return prisma.booking.update({ where: { id }, data: { status: "CANCELLED" }, include: bookingInclude });
}
