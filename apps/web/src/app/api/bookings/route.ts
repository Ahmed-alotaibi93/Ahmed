import { requireUserId } from "@/server/auth";
import { bookingInclude, createBooking } from "@/server/bookings";
import { json, options, readJson, route } from "@/server/http";
import { prisma } from "@/server/prisma";
import { createBookingSchema } from "@/server/schemas";

export const OPTIONS = options;

export const GET = route(async (req) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: requireUserId(req) },
    orderBy: { pickupAt: "desc" },
    include: bookingInclude,
  });
  return json({ bookings });
});

export const POST = route(async (req) => {
  const userId = requireUserId(req);
  const body = createBookingSchema.parse(await readJson(req));
  return json(await createBooking(userId, body), 201);
});
