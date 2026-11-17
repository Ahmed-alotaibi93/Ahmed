import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const TEST_DB = process.env.TEST_DATABASE_URL ?? "postgresql://postgres@localhost:5432/airport_ride_test";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "next/server": fileURLToPath(new URL("./test/next-server-stub.ts", import.meta.url)),
    },
  },
  test: {
    env: { DATABASE_URL: TEST_DB, DATABASE_URL_UNPOOLED: TEST_DB, JWT_SECRET: "test-secret", NODE_ENV: "test" },
    globalSetup: "./test/global-setup.ts",
    fileParallelism: false,
  },
});
