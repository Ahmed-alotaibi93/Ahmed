import { z } from "zod";
import { signToken } from "@/server/auth";
import { verifyOtp } from "@/server/bookings";
import { json, options, readJson, route } from "@/server/http";
import { phoneSchema } from "@/server/schemas";

export const OPTIONS = options;
export const POST = route(async (req) => {
  const { phone, code } = z.object({ phone: phoneSchema, code: z.string().length(6) }).parse(await readJson(req));
  const user = await verifyOtp(phone, code);
  return json({ token: signToken(user.id), user });
});
