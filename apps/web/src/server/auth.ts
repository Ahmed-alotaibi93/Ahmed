import jwt from "jsonwebtoken";
import { config } from "./config";
import { HttpError } from "./errors";

export function signToken(userId: number) {
  return jwt.sign({ sub: String(userId) }, config.jwtSecret, { expiresIn: "30d" });
}

/** يرجع رقم المستخدم من ترويسة Authorization أو يرمي 401 */
export function requireUserId(req: Request): number {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new HttpError(401, "UNAUTHORIZED");
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as jwt.JwtPayload;
    return Number(payload.sub);
  } catch {
    throw new HttpError(401, "UNAUTHORIZED");
  }
}

/** يقبل 05XXXXXXXX أو 5XXXXXXXX أو +9665XXXXXXXX ويرجع +9665XXXXXXXX */
export function normalizeSaudiPhone(input: string): string | null {
  const digits = input.replace(/[\s-]/g, "");
  const m = digits.match(/^(?:\+?966|0)?(5\d{8})$/);
  return m ? `+966${m[1]}` : null;
}
