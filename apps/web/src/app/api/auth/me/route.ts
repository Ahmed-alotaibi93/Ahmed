import { z } from "zod";
import { requireUserId } from "@/server/auth";
import { HttpError } from "@/server/errors";
import { json, options, readJson, route } from "@/server/http";
import { prisma } from "@/server/prisma";

export const OPTIONS = options;

export const GET = route(async (req) => {
  const user = await prisma.user.findUnique({ where: { id: requireUserId(req) } });
  if (!user) throw new HttpError(401, "UNAUTHORIZED");
  return json({ user });
});

export const PATCH = route(async (req) => {
  const userId = requireUserId(req);
  const { name } = z.object({ name: z.string().trim().min(1).max(80) }).parse(await readJson(req));
  return json({ user: await prisma.user.update({ where: { id: userId }, data: { name } }) });
});
