import { ZodError } from "zod";
import { HttpError } from "./errors";

// التطبيق (Expo) يتصل بالـ API من نطاق مختلف، فنسمح بـ CORS.
// الجلسة عبر ترويسة Authorization (مو كوكيز)، فالسماح لكل النطاقات آمن هنا.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

export function options() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** يغلف الـ handler: يحول الأخطاء لردود JSON موحدة ويضيف CORS */
export function route<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ZodError) {
        return json({ error: "VALIDATION_ERROR", details: err.flatten().fieldErrors }, 400);
      }
      if (err instanceof HttpError) {
        return json({ error: err.code, message: err.message }, err.status);
      }
      console.error(err);
      return json({ error: "INTERNAL_ERROR" }, 500);
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
