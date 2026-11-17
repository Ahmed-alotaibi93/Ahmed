import { connection } from "next/server";
import { json, options, route } from "@/server/http";
import { prisma } from "@/server/prisma";

export const OPTIONS = options;
export const GET = route(async () => {
  await connection();
  const airports = await prisma.airport.findMany({ where: { active: true }, orderBy: { id: "asc" } });
  return json({ airports });
});
