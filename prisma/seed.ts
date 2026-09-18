import { prisma } from "../database/prisma.js";
import { slugify } from "../modules/category/category.service.js";

type ProductSeed = {
  codigo_produto: string;
  descricao_produto: string;
  preco: number;
  categoria: string;
  tags?: string[];
  status?: "ACTIVE" | "INACTIVE";
};

const CATEGORIES = [
  { nome: "Chopps e Cervejas", ordem: 0 },
  { nome: "Drinks", ordem: 1 },
  { nome: "Sem álcool", ordem: 2 },
  { nome: "Cozinha", ordem: 3 },
];

// Preço em centavos, como a API trabalha.
const PRODUCTS: ProductSeed[] = [
  { codigo_produto: "CERV001", descricao_produto: "Cerveja IPA 500ml", preco: 2290, categoria: "Chopps e Cervejas" },
  { codigo_produto: "CERV002", descricao_produto: "Cerveja Lager 600ml", preco: 1890, categoria: "Chopps e Cervejas" },
  { codigo_produto: "CERV003", descricao_produto: "Cerveja Pilsen Long Neck", preco: 1490, categoria: "Chopps e Cervejas" },
  { codigo_produto: "CERV004", descricao_produto: "Cerveja Weiss 500ml", preco: 2390, categoria: "Chopps e Cervejas" },
  { codigo_produto: "CERV005", descricao_produto: "Cerveja Stout 473ml", preco: 2590, categoria: "Chopps e Cervejas", status: "INACTIVE" },
  { codigo_produto: "CERV006", descricao_produto: "Chopp sem álcool 500ml", preco: 1690, categoria: "Chopps e Cervejas", tags: ["sem-alcool", "novidade"] },
  { codigo_produto: "DRK001", descricao_produto: "Caipirinha de Limão", preco: 2200, categoria: "Drinks" },
  { codigo_produto: "DRK002", descricao_produto: "Caipirinha de Morango", preco: 2600, categoria: "Drinks" },
  { codigo_produto: "DRK003", descricao_produto: "Gin Tônica", preco: 2900, categoria: "Drinks", tags: ["autoral"] },
  { codigo_produto: "DRK004", descricao_produto: "Moscow Mule", preco: 3200, categoria: "Drinks" },
  { codigo_produto: "DRK005", descricao_produto: "Negroni", preco: 3400, categoria: "Drinks" },
  { codigo_produto: "DRK006", descricao_produto: "Aperol Spritz", preco: 3600, categoria: "Drinks", tags: ["low-abv"], status: "INACTIVE" },
  { codigo_produto: "DRK007", descricao_produto: "Gin tônica sem álcool", preco: 1900, categoria: "Drinks", tags: ["sem-alcool", "novidade"] },
  { codigo_produto: "NALK001", descricao_produto: "Água Mineral", preco: 600, categoria: "Sem álcool", tags: ["sem-alcool"] },
  { codigo_produto: "NALK002", descricao_produto: "Água com Gás", preco: 700, categoria: "Sem álcool", tags: ["sem-alcool"] },
  { codigo_produto: "NALK003", descricao_produto: "Coca-Cola Lata", preco: 900, categoria: "Sem álcool", tags: ["sem-alcool"] },
  { codigo_produto: "NALK004", descricao_produto: "Guaraná Lata", preco: 900, categoria: "Sem álcool", tags: ["sem-alcool"] },
  { codigo_produto: "NALK005", descricao_produto: "Suco de Laranja Natural", preco: 1200, categoria: "Sem álcool", tags: ["sem-alcool", "vegano"] },
  { codigo_produto: "FOOD001", descricao_produto: "Batata Frita", preco: 3200, categoria: "Cozinha", tags: ["vegetariano"] },
  { codigo_produto: "FOOD002", descricao_produto: "Batata Frita com Cheddar e Bacon", preco: 4200, categoria: "Cozinha" },
  { codigo_produto: "FOOD003", descricao_produto: "Calabresa Acebolada", preco: 3800, categoria: "Cozinha" },
  { codigo_produto: "FOOD004", descricao_produto: "Frango à Passarinho", preco: 4900, categoria: "Cozinha", status: "INACTIVE" },
  { codigo_produto: "FOOD005", descricao_produto: "Hambúrguer Artesanal", preco: 3900, categoria: "Cozinha", tags: ["autoral"] },
  { codigo_produto: "FOOD006", descricao_produto: "Pastel de Carne", preco: 1400, categoria: "Cozinha" },
];

// Fotos reais do bar, copiadas do ambiente publicado. As URLs do Cloudinary
// são públicas, então o banco local nasce com as mesmas imagens da carta.
const FOTOS: Record<string, { foto: string; thumb: string }> = {
  CERV001: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197630/temnobar/products/d96a8127002353998931aa40.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197630/temnobar/products/d96a8127002353998931aa40_thumb.webp",
  },
  CERV002: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197653/temnobar/products/d3b283721459f256011b1df9.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197653/temnobar/products/d3b283721459f256011b1df9_thumb.webp",
  },
  CERV003: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197662/temnobar/products/b1e17574cc967d9963d9c6f9.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197662/temnobar/products/b1e17574cc967d9963d9c6f9_thumb.webp",
  },
  CERV004: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197671/temnobar/products/5a02b179e35bb98d2d19a8a8.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197671/temnobar/products/5a02b179e35bb98d2d19a8a8_thumb.webp",
  },
  CERV005: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197593/temnobar/products/e8d096bbd6998e725857ae14.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197593/temnobar/products/e8d096bbd6998e725857ae14_thumb.webp",
  },
  DRK001: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197688/temnobar/products/a152176afa02aff92f46b7df.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197688/temnobar/products/a152176afa02aff92f46b7df_thumb.webp",
  },
  DRK002: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197619/temnobar/products/259bbf5ed0e84c10793546c1.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197619/temnobar/products/259bbf5ed0e84c10793546c1_thumb.webp",
  },
  DRK003: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197709/temnobar/products/5540e7641396f7a119ea0d23.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197709/temnobar/products/5540e7641396f7a119ea0d23_thumb.webp",
  },
  DRK004: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197721/temnobar/products/6f87f584fbd7cccf1e68ffb1.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197721/temnobar/products/6f87f584fbd7cccf1e68ffb1_thumb.webp",
  },
  DRK005: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197731/temnobar/products/205978212e7b121f5cd7d512.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197731/temnobar/products/205978212e7b121f5cd7d512_thumb.webp",
  },
  DRK006: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197740/temnobar/products/9fb5636141f939e4bcaeeb70.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197740/temnobar/products/9fb5636141f939e4bcaeeb70_thumb.webp",
  },
  NALK001: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197752/temnobar/products/49e80f92098740514d3bca64.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197752/temnobar/products/49e80f92098740514d3bca64_thumb.webp",
  },
  NALK002: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197773/temnobar/products/f83d9f1760049fd6bc43bfcc.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197773/temnobar/products/f83d9f1760049fd6bc43bfcc_thumb.webp",
  },
  NALK003: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197782/temnobar/products/c99c80ab0913e5db8785f75d.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197782/temnobar/products/c99c80ab0913e5db8785f75d_thumb.webp",
  },
  NALK004: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197791/temnobar/products/a75c40b88c0e4e4fc7eb68f7.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197791/temnobar/products/a75c40b88c0e4e4fc7eb68f7_thumb.webp",
  },
  NALK005: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197800/temnobar/products/0f078a09a3d8c259a313bdf6.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197800/temnobar/products/0f078a09a3d8c259a313bdf6_thumb.webp",
  },
  FOOD001: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197817/temnobar/products/8dea40da22ed7ca64a282734.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197817/temnobar/products/8dea40da22ed7ca64a282734_thumb.webp",
  },
  FOOD002: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197828/temnobar/products/077877499a8a1f0efd153bef.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197828/temnobar/products/077877499a8a1f0efd153bef_thumb.webp",
  },
  FOOD003: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197837/temnobar/products/ae03356da57b4ab3a3dd0f48.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197837/temnobar/products/ae03356da57b4ab3a3dd0f48_thumb.webp",
  },
  FOOD004: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197852/temnobar/products/605a860a6f7068e3f2d78413.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197852/temnobar/products/605a860a6f7068e3f2d78413_thumb.webp",
  },
  FOOD005: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197866/temnobar/products/7eb00386213c4917111bb23a.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197866/temnobar/products/7eb00386213c4917111bb23a_thumb.webp",
  },
  FOOD006: {
    foto: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197875/temnobar/products/1e5ff77bf13eef47833f9720.webp",
    thumb: "https://res.cloudinary.com/dzc7gh6wv/image/upload/v1776197875/temnobar/products/1e5ff77bf13eef47833f9720_thumb.webp",
  },
};

// Rupturas passadas, para a tela de saúde do cardápio nascer com histórico.
const RUPTURES: { codigo_produto: string; dias_atras: number[] }[] = [
  { codigo_produto: "CERV005", dias_atras: [22, 15, 8, 1] },
  { codigo_produto: "FOOD004", dias_atras: [18, 6, 2] },
  { codigo_produto: "DRK006", dias_atras: [11, 3] },
];

function diasAtras(dias: number): Date {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
}

async function main() {
  // O .env local aponta para produção: semear sem querer o banco de verdade
  // seria fácil demais. Para um banco remoto, rode com SEED_ALLOW_REMOTE=true.
  const url = process.env["DATABASE_URL"] ?? "";
  const bancoLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);

  if (!bancoLocal && process.env["SEED_ALLOW_REMOTE"] !== "true") {
    throw new Error(
      "DATABASE_URL não aponta para um banco local. Use SEED_ALLOW_REMOTE=true para semear mesmo assim.",
    );
  }

  const bar = await prisma.bar.upsert({
    where: { slug: "default" },
    update: {},
    create: { nome: "TemNoBar", slug: "default" },
  });

  console.log("Bar:", bar.nome, `(${bar.id})`);

  const categoriaPorNome = new Map<string, string>();

  for (const categoria of CATEGORIES) {
    const registro = await prisma.category.upsert({
      where: { bar_id_slug: { bar_id: bar.id, slug: slugify(categoria.nome) } },
      update: { ordem: categoria.ordem },
      create: {
        nome: categoria.nome,
        slug: slugify(categoria.nome),
        ordem: categoria.ordem,
        bar_id: bar.id,
      },
    });
    categoriaPorNome.set(categoria.nome, registro.id);
  }

  console.log(`Categorias: ${CATEGORIES.length}`);

  for (const produto of PRODUCTS) {
    const foto = FOTOS[produto.codigo_produto];
    const dados = {
      descricao_produto: produto.descricao_produto,
      preco: produto.preco,
      tags: produto.tags ?? [],
      status: produto.status ?? "ACTIVE",
      category_id: categoriaPorNome.get(produto.categoria) ?? null,
      foto_produto: foto?.foto ?? null,
      thumb_produto: foto?.thumb ?? null,
    };

    // O update preenche preço, seção e etiquetas em bases criadas antes
    // desses campos existirem.
    await prisma.product.upsert({
      where: {
        bar_id_codigo_produto: {
          codigo_produto: produto.codigo_produto,
          bar_id: bar.id,
        },
      },
      update: dados,
      create: {
        ...dados,
        codigo_produto: produto.codigo_produto,
        bar_id: bar.id,
      },
    });
  }

  console.log(`Produtos: ${PRODUCTS.length}`);

  const historicoExistente = await prisma.productAvailabilityLog.count({
    where: { bar_id: bar.id },
  });

  if (historicoExistente === 0) {
    for (const ruptura of RUPTURES) {
      const produto = await prisma.product.findUnique({
        where: {
          bar_id_codigo_produto: {
            codigo_produto: ruptura.codigo_produto,
            bar_id: bar.id,
          },
        },
      });
      if (!produto) continue;

      for (const dias of ruptura.dias_atras) {
        await prisma.productAvailabilityLog.create({
          data: {
            product_id: produto.id,
            bar_id: bar.id,
            status: "INACTIVE",
            created_at: diasAtras(dias),
          },
        });
        await prisma.productAvailabilityLog.create({
          data: {
            product_id: produto.id,
            bar_id: bar.id,
            status: "ACTIVE",
            created_at: diasAtras(dias - 0.5),
          },
        });
      }
    }
    console.log("Histórico de disponibilidade semeado");
  } else {
    console.log("Histórico de disponibilidade já existia, mantido");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
