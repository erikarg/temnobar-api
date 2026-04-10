import { beforeEach, afterAll } from "vitest";
import { prisma } from "../database/prisma.js";

beforeEach(async () => {
  await prisma.$executeRawUnsafe('DELETE FROM "products"');
  await prisma.$executeRawUnsafe('DELETE FROM "bars"');
  await prisma.$executeRawUnsafe('DELETE FROM "users"');
});

afterAll(async () => {
  await prisma.$disconnect();
});
