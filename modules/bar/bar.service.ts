import { prisma } from "../../database/prisma.js";

export async function list() {
  return prisma.bar.findMany({ orderBy: { nome: "asc" } });
}

export async function create(data: { nome: string; slug: string }) {
  return prisma.bar.create({ data });
}
