import { execSync } from "node:child_process";

// غير هدّام: يطبق الترحيلات ويعبي البيانات الأساسية (upsert) بدون مسح شيء
export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://postgres@localhost:5432/airport_ride_test";
  const env = { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: url };
  execSync("npx prisma migrate deploy", { env, stdio: "inherit" });
  execSync("npx tsx prisma/seed.ts", { env, stdio: "inherit" });
}
