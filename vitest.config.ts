import "dotenv/config";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV,
    },
    globalSetup: "./tests/global-setup.ts",
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
  },
});
