import { z } from "zod";
import { requireUserId } from "@/server/auth";
import { cancelBooking } from "@/server/bookings";
import { json, options, route } from "@/server/http";

export const OPTIONS = options;
export const POST = route<RouteContext<"/api/bookings/[id]/cancel">>(async (req, ctx) => {
  const id = z.coerce.number().int().parse((await ctx.params).id);
  return json({ booking: await cancelBooking(requireUserId(req), id) });
});
