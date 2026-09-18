import type { ProductStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../database/prisma.js";
import { ForbiddenError, NotFoundError } from "../../lib/errors.js";

interface CreateProductInput {
  codigo_produto: string;
  descricao_produto: string;
  status?: ProductStatus;
  foto_produto?: string | null;
  thumb_produto?: string | null;
  preco?: number;
  tags?: string[];
  category_id?: string | null;
  bar_id: string;
}

interface UpdateProductInput {
  codigo_produto?: string;
  descricao_produto?: string;
  status?: ProductStatus;
  foto_produto?: string | null;
  thumb_produto?: string | null;
  preco?: number;
  tags?: string[];
  category_id?: string | null;
}

interface ListProductsInput {
  status?: ProductStatus;
  search?: string;
  page: number;
  per_page: number;
  bar_id?: string;
  category_id?: string;
}

const RUPTURE_WINDOW_DAYS = 30;

export async function create(
  data: CreateProductInput,
  actorBarId: string,
  actorUserId?: string,
) {
  if (data.bar_id !== actorBarId) {
    throw new ForbiddenError("Product does not belong to your bar");
  }

  await assertCategoryBelongsToBar(data.category_id, actorBarId);

  const product = await prisma.product.create({ data });

  await logAvailability(product.id, product.bar_id, product.status, actorUserId);

  return product;
}

export async function list(input: ListProductsInput) {
  const { status, search, bar_id, category_id, page = 1, per_page = 20 } = input;

  const skip = (page - 1) * per_page;

  const where = {
    ...(status && { status }),
    ...(bar_id && { bar_id }),
    ...(category_id && { category_id }),
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
      include: { category: { select: { id: true, nome: true, slug: true } } },
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
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, nome: true, slug: true } } },
  });
  if (!product) throw new NotFoundError("Product");
  return product;
}

export async function update(
  id: string,
  data: UpdateProductInput,
  actorBarId: string,
  actorUserId?: string,
) {
  const current = await getOwnedById(id, actorBarId);

  if (data.category_id !== undefined) {
    await assertCategoryBelongsToBar(data.category_id, actorBarId);
  }

  const product = await prisma.product.update({ where: { id }, data });

  if (data.status && data.status !== current.status) {
    await logAvailability(product.id, product.bar_id, product.status, actorUserId);
  }

  return product;
}

export async function setStatus(
  id: string,
  status: ProductStatus,
  actorBarId: string,
  actorUserId?: string,
) {
  const current = await getOwnedById(id, actorBarId);

  if (current.status === status) return current;

  const product = await prisma.product.update({ where: { id }, data: { status } });

  await logAvailability(product.id, product.bar_id, product.status, actorUserId);

  return product;
}

export async function remove(id: string, actorBarId: string) {
  await getOwnedById(id, actorBarId);
  return prisma.product.delete({ where: { id } });
}

// Saude do cardapio: o que da para medir sem dados de venda.
export async function health(barId: string) {
  const since = new Date(Date.now() - RUPTURE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [total, semFoto, semPreco, semCategoria, esgotados, neverEdited, rupturas] =
    await Promise.all([
      prisma.product.count({ where: { bar_id: barId } }),
      prisma.product.count({ where: { bar_id: barId, thumb_produto: null } }),
      prisma.product.count({ where: { bar_id: barId, preco: 0 } }),
      prisma.product.count({ where: { bar_id: barId, category_id: null } }),
      prisma.product.count({ where: { bar_id: barId, status: "INACTIVE" } }),
      prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*)::int AS count FROM products
        WHERE bar_id = ${barId} AND updated_at = created_at
      `,
      prisma.productAvailabilityLog.groupBy({
        by: ["product_id"],
        where: { bar_id: barId, status: "INACTIVE", created_at: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { product_id: "desc" } },
        take: 5,
      }),
    ]);

  const rupturaProdutos = await prisma.product.findMany({
    where: { id: { in: rupturas.map((r) => r.product_id) } },
    select: { id: true, codigo_produto: true, descricao_produto: true },
  });

  return {
    total,
    sem_foto: semFoto,
    sem_preco: semPreco,
    sem_categoria: semCategoria,
    esgotados,
    nunca_editados: neverEdited[0]?.count ?? 0,
    janela_dias: RUPTURE_WINDOW_DAYS,
    mais_esgotam: rupturas
      .map((r) => {
        const produto = rupturaProdutos.find((p) => p.id === r.product_id);
        if (!produto) return null;
        return { ...produto, vezes: r._count._all };
      })
      .filter((item) => item !== null),
  };
}

export async function availabilityHistory(id: string, actorBarId: string) {
  await getOwnedById(id, actorBarId);

  return prisma.productAvailabilityLog.findMany({
    where: { product_id: id },
    orderBy: { created_at: "desc" },
    take: 20,
  });
}

// 404 em vez de 403 quando o produto e de outro bar: nao revela que o id existe.
async function getOwnedById(id: string, actorBarId: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.bar_id !== actorBarId) throw new NotFoundError("Product");
  return product;
}

async function assertCategoryBelongsToBar(
  categoryId: string | null | undefined,
  barId: string,
) {
  if (!categoryId) return;

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category || category.bar_id !== barId) {
    throw new NotFoundError("Category");
  }
}

function logAvailability(
  productId: string,
  barId: string,
  status: ProductStatus,
  userId?: string,
) {
  return prisma.productAvailabilityLog.create({
    data: { product_id: productId, bar_id: barId, status, user_id: userId ?? null },
  });
}
