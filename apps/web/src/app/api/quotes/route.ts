import { json, options, readJson, route } from "@/server/http";
import { buildQuote } from "@/server/quote";
import { quoteSchema } from "@/server/schemas";

export const OPTIONS = options;
export const POST = route(async (req) => json(await buildQuote(quoteSchema.parse(await readJson(req)))));
