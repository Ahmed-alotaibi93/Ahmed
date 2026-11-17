import { Router } from "express";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { config } from "../lib/config.js";
import { HttpError } from "../lib/errors.js";
import { requireAuth, signToken, type AuthedRequest } from "../lib/auth.js";

export const authRouter = Router();

/** يقبل 05XXXXXXXX أو 5XXXXXXXX أو +9665XXXXXXXX ويرجع +9665XXXXXXXX */
export function normalizeSaudiPhone(input: string): string | null {
  const digits = input.replace(/[\s-]/g, "");
  const m = digits.match(/^(?:\+?966|0)?(5\d{8})$/);
  return m ? `+966${m[1]}` : null;
}

const phoneSchema = z.string().transform((v, ctx) => {
  const p = normalizeSaudiPhone(v);
  if (!p) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid Saudi mobile number" });
    return z.NEVER;
  }
  return p;
});

const OTP_TTL_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;

authRouter.post("/request-otp", async (req, res) => {
  const { phone } = z.object({ phone: phoneSchema }).parse(req.body);
  const code = String(randomInt(100000, 1000000));
  await prisma.otpCode.updateMany({ where: { phone, used: false }, data: { used: true } });
  await prisma.otpCode.create({ data: { phone, code, expiresAt: new Date(Date.now() + OTP_TTL_MS) } });
  // TODO: ربط مزود SMS (Unifonic / Twilio). حالياً يطبع الرمز في السجل.
  console.log(`[OTP] ${phone}: ${code}`);
  res.json({ ok: true, phone, ...(config.isProd ? {} : { devCode: code }) });
});

authRouter.post("/verify-otp", async (req, res) => {
  const { phone, code } = z.object({ phone: phoneSchema, code: z.string().length(6) }).parse(req.body);
  const otp = await prisma.otpCode.findFirst({
    where: { phone, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.attempts >= MAX_ATTEMPTS) throw new HttpError(400, "OTP_EXPIRED");
  if (otp.code !== code) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new HttpError(400, "OTP_INVALID");
  }
  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
  const user = await prisma.user.upsert({ where: { phone }, update: {}, create: { phone } });
  res.json({ token: signToken(user.id), user });
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw new HttpError(401, "UNAUTHORIZED");
  res.json({ user });
});

authRouter.patch("/me", requireAuth, async (req: AuthedRequest, res) => {
  const { name } = z.object({ name: z.string().trim().min(1).max(80) }).parse(req.body);
  const user = await prisma.user.update({ where: { id: req.userId }, data: { name } });
  res.json({ user });
});
