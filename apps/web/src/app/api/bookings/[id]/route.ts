import { z } from "zod";
import { requireUserId } from "@/server/auth";
import { findOwnBooking } from "@/server/bookings";
import { json, options, route } from "@/server/http";

export const OPTIONS = options;
export const GET = route<RouteContext<"/api/bookings/[id]">>(async (req, ctx) => {
  const id = z.coerce.number().int().parse((await ctx.params).id);
  return json({ booking: await findOwnBooking(requireUserId(req), id) });
});
