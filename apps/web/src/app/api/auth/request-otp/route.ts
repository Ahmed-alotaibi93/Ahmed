import { z } from "zod";
import { issueOtp } from "@/server/bookings";
import { config } from "@/server/config";
import { json, options, readJson, route } from "@/server/http";
import { phoneSchema } from "@/server/schemas";

export const OPTIONS = options;
export const POST = route(async (req) => {
  const { phone } = z.object({ phone: phoneSchema }).parse(await readJson(req));
  const code = await issueOtp(phone);
  return json({ ok: true, phone, ...(config.showDevOtp ? { devCode: code } : {}) });
});
