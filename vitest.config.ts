// Carrega o .env local (Cloudinary etc). DATABASE_URL e NODE_ENV sao
// sobrescritos abaixo e tem precedencia sobre o que vier do .env.
import "dotenv/config";
import { defineConfig } from "vitest/config";

// Fixo e local por seguranca: tests/setup.ts faz DELETE nas tabelas a cada teste,
// e o .env local pode apontar para um banco remoto.
const TEST_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/temnobar_test?schema=public";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: "test-secret-at-least-32-characters-long",
      PORT: "3333",
      NODE_ENV: "test",
      API_URL: "http://localhost:3333",
      APP_URL: "http://localhost:3000",
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "",
    },
    include: ["tests/**/*.test.ts"],
    globalSetup: "./tests/global-setup.ts",
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
  },
});
