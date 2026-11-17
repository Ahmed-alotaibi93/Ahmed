import { PrismaClient } from "@prisma/client";

// نسخة وحدة أثناء التطوير عشان إعادة التحميل ما تفتح اتصالات كثيرة
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
