import type { ProductStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../database/prisma.js";
import { ForbiddenError, NotFoundError } from "../../lib/errors.js";

interface CreateProductInput {
  codigo_produto: string;
  descricao_produto: string;
  status?: ProductStatus;
  foto_produto?: string | null;
  thumb_produto?: string | null;
  bar_id: string;
}

interface UpdateProductInput {
  codigo_produto?: string;
  descricao_produto?: string;
  status?: ProductStatus;
  foto_produto?: string | null;
  thumb_produto?: string | null;
}

interface ListProductsInput {
  status?: ProductStatus;
  search?: string;
  page: number;
  per_page: number;
  bar_id?: string;
}

export async function create(data: CreateProductInput, actorBarId: string) {
  if (data.bar_id !== actorBarId) {
    throw new ForbiddenError("Product does not belong to your bar");
  }
  return prisma.product.create({ data });
}

export async function list(input: ListProductsInput) {
  const { status, search, bar_id, page = 1, per_page = 20 } = input;

  const skip = (page - 1) * per_page;

  const where = {
    ...(status && { status }),
    ...(bar_id && { bar_id }),
    ...(search && {
      descricao_produto: { contains: search, mode: "insensitive" as const },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: per_page,
      orderBy: [{ status: "asc" }, { created_at: "desc" }],
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      per_page,
      total,
      total_pages: Math.ceil(total / per_page),
    },
  };
}

export async function getById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new NotFoundError("Product");
  return product;
}

export async function update(
  id: string,
  data: UpdateProductInput,
  actorBarId: string,
) {
  await getOwnedById(id, actorBarId);
  return prisma.product.update({ where: { id }, data });
}

export async function remove(id: string, actorBarId: string) {
  await getOwnedById(id, actorBarId);
  return prisma.product.delete({ where: { id } });
}

// 404 em vez de 403 quando o produto e de outro bar: nao revela que o id existe.
async function getOwnedById(id: string, actorBarId: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.bar_id !== actorBarId) throw new NotFoundError("Product");
  return product;
}
