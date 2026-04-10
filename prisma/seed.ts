import { prisma } from "../database/prisma.js";

async function main() {
  const bar = await prisma.bar.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      nome: "TemNoBar",
      slug: "default",
    },
  });

  console.log("Seeded default bar:", bar.id);

  const products = [
    { codigo_produto: "CERV001", descricao_produto: "Cerveja IPA 500ml" },
    { codigo_produto: "CERV002", descricao_produto: "Cerveja Lager 600ml" },
    {
      codigo_produto: "CERV003",
      descricao_produto: "Cerveja Pilsen Long Neck",
    },
    { codigo_produto: "CERV004", descricao_produto: "Cerveja Weiss 500ml" },
    { codigo_produto: "CERV005", descricao_produto: "Cerveja Stout 473ml" },
    { codigo_produto: "DRK001", descricao_produto: "Caipirinha de Limão" },
    { codigo_produto: "DRK002", descricao_produto: "Caipirinha de Morango" },
    { codigo_produto: "DRK003", descricao_produto: "Gin Tônica" },
    { codigo_produto: "DRK004", descricao_produto: "Moscow Mule" },
    { codigo_produto: "DRK005", descricao_produto: "Negroni" },
    { codigo_produto: "DRK006", descricao_produto: "Aperol Spritz" },
    { codigo_produto: "NALK001", descricao_produto: "Água Mineral" },
    { codigo_produto: "NALK002", descricao_produto: "Água com Gás" },
    { codigo_produto: "NALK003", descricao_produto: "Coca-Cola Lata" },
    { codigo_produto: "NALK004", descricao_produto: "Guaraná Lata" },
    { codigo_produto: "NALK005", descricao_produto: "Suco de Laranja Natural" },
    { codigo_produto: "FOOD001", descricao_produto: "Batata Frita" },
    {
      codigo_produto: "FOOD002",
      descricao_produto: "Batata Frita com Cheddar e Bacon",
    },
    { codigo_produto: "FOOD003", descricao_produto: "Calabresa Acebolada" },
    { codigo_produto: "FOOD004", descricao_produto: "Frango à Passarinho" },
    { codigo_produto: "FOOD005", descricao_produto: "Hambúrguer Artesanal" },
    { codigo_produto: "FOOD006", descricao_produto: "Pastel de Carne" },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        bar_id_codigo_produto: {
          codigo_produto: product.codigo_produto,
          bar_id: bar.id,
        },
      },
      update: {},
      create: {
        ...product,
        bar_id: bar.id,
        status: "ACTIVE",
      },
    });
  }

  console.log("Products seeded successfully");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
