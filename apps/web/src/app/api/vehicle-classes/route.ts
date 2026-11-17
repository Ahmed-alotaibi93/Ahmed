import { connection } from "next/server";
import { json, options, route } from "@/server/http";
import { prisma } from "@/server/prisma";

export const OPTIONS = options;
export const GET = route(async () => {
  await connection();
  const vehicleClasses = await prisma.vehicleClass.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return json({ vehicleClasses });
});
