import { prisma } from "../../database/prisma.js";
import { NotFoundError } from "../../lib/errors.js";

// Cardapio publico: item esgotado continua na carta, marcado como indisponivel.
export async function menuBySlug(slug: string) {
  const bar = await prisma.bar.findUnique({
    where: { slug },
    select: { id: true, nome: true, slug: true, updated_at: true },
  });

  if (!bar) throw new NotFoundError("Bar");

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { bar_id: bar.id },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
      select: { id: true, nome: true, slug: true, ordem: true },
    }),
    prisma.product.findMany({
      where: { bar_id: bar.id },
      orderBy: [{ status: "asc" }, { descricao_produto: "asc" }],
      select: {
        id: true,
        descricao_produto: true,
        preco: true,
        tags: true,
        status: true,
        foto_produto: true,
        thumb_produto: true,
        category_id: true,
      },
    }),
  ]);

  const toItem = (product: (typeof products)[number]) => ({
    id: product.id,
    descricao_produto: product.descricao_produto,
    preco: product.preco,
    tags: product.tags,
    disponivel: product.status === "ACTIVE",
    foto_produto: product.foto_produto,
    thumb_produto: product.thumb_produto,
  });

  const secoes = categories.map((category) => ({
    ...category,
    itens: products
      .filter((product) => product.category_id === category.id)
      .map(toItem),
  }));

  const semCategoria = products.filter((product) => !product.category_id);

  if (semCategoria.length > 0) {
    secoes.push({
      id: "sem-categoria",
      nome: "Outros",
      slug: "outros",
      ordem: 999,
      itens: semCategoria.map(toItem),
    });
  }

  return {
    bar,
    secoes: secoes.filter((secao) => secao.itens.length > 0),
    total_itens: products.length,
    total_indisponiveis: products.filter((p) => p.status === "INACTIVE").length,
  };
}
