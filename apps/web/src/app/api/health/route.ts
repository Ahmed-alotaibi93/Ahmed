import { json, options } from "@/server/http";

export const OPTIONS = options;
export async function GET() {
  return json({ ok: true });
}
