import { beforeEach, afterAll } from "vitest";
import { prisma } from "../database/prisma.js";

// Guarda de seguranca: o beforeEach abaixo apaga todas as tabelas.
const databaseUrl = process.env.DATABASE_URL ?? "";
const isLocalTestDatabase =
  /@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl) &&
  databaseUrl.includes("temnobar_test");

if (!isLocalTestDatabase) {
  throw new Error(
    "Testes abortados: DATABASE_URL precisa apontar para o banco de teste local (temnobar_test).",
  );
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe('DELETE FROM "product_availability_logs"');
  await prisma.$executeRawUnsafe('DELETE FROM "products"');
  await prisma.$executeRawUnsafe('DELETE FROM "categories"');
  await prisma.$executeRawUnsafe('DELETE FROM "bars"');
  await prisma.$executeRawUnsafe('DELETE FROM "users"');
});

afterAll(async () => {
  await prisma.$disconnect();
});
