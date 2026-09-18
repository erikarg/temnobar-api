import { prisma } from "../../database/prisma.js";
import { NotFoundError } from "../../lib/errors.js";

interface CategoryInput {
  nome: string;
  ordem?: number;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function list(barId: string) {
  return prisma.category.findMany({
    where: { bar_id: barId },
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    include: { _count: { select: { products: true } } },
  });
}

export async function create(data: CategoryInput, barId: string) {
  return prisma.category.create({
    data: {
      nome: data.nome,
      slug: slugify(data.nome),
      ordem: data.ordem ?? 0,
      bar_id: barId,
    },
  });
}

export async function update(
  id: string,
  data: Partial<CategoryInput>,
  barId: string,
) {
  await getOwnedById(id, barId);

  return prisma.category.update({
    where: { id },
    data: {
      ...(data.nome !== undefined && {
        nome: data.nome,
        slug: slugify(data.nome),
      }),
      ...(data.ordem !== undefined && { ordem: data.ordem }),
    },
  });
}

export async function remove(id: string, barId: string) {
  await getOwnedById(id, barId);
  // Os produtos continuam existindo: category_id vira null (onDelete: SetNull).
  return prisma.category.delete({ where: { id } });
}

// 404 em vez de 403 quando a categoria e de outro bar: nao revela que o id existe.
export async function getOwnedById(id: string, barId: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category || category.bar_id !== barId) throw new NotFoundError("Category");
  return category;
}
