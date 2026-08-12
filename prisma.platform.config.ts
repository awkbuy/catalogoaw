import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/platform.prisma",
  migrations: {
    path: "prisma/migrations/platform",
    seed: undefined,
  },
  datasource: {
    url: process.env["PLATFORM_DATABASE_URL"] || "file:./data/platform.db",
  },
});
