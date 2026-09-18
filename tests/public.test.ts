import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { registerAndLogin, createBar } from "./helpers.js";

async function setupMenu() {
  const { cookie } = await registerAndLogin("menu@example.com");
  const { bar, cookie: barCookie } = await createBar(
    cookie,
    "Boteco do Zé",
    "boteco-do-ze",
  );

  const chopps = await request(app)
    .post("/api/v1/categories")
    .set("Cookie", barCookie)
    .send({ nome: "Chopps", ordem: 1 });

  await request(app)
    .post("/api/v1/products")
    .set("Cookie", barCookie)
    .send({
      codigo_produto: "CERV001",
      descricao_produto: "Chopp Pilsen 500ml",
      bar_id: bar.id,
      category_id: chopps.body.data.id,
      preco: 1490,
      tags: ["novidade"],
    });

  await request(app)
    .post("/api/v1/products")
    .set("Cookie", barCookie)
    .send({
      codigo_produto: "DRK002",
      descricao_produto: "Caipirinha de limão",
      bar_id: bar.id,
      category_id: chopps.body.data.id,
      preco: 2200,
      status: "INACTIVE",
    });

  await request(app)
    .post("/api/v1/products")
    .set("Cookie", barCookie)
    .send({
      codigo_produto: "PORC001",
      descricao_produto: "Batata frita",
      bar_id: bar.id,
      preco: 3500,
    });

  return { cookie: barCookie, barId: bar.id };
}

describe("GET /api/v1/public/bares/:slug/cardapio", () => {
  it("serves the menu grouped by section without authentication", async () => {
    await setupMenu();

    const res = await request(app).get("/api/v1/public/bares/boteco-do-ze/cardapio");

    expect(res.status).toBe(200);
    expect(res.body.data.bar.nome).toBe("Boteco do Zé");
    expect(res.body.data.secoes.map((s: { nome: string }) => s.nome)).toEqual([
      "Chopps",
      "Outros",
    ]);
    expect(res.body.data.total_itens).toBe(3);
  });

  it("keeps a sold out item on the menu, marked as unavailable", async () => {
    await setupMenu();

    const res = await request(app).get("/api/v1/public/bares/boteco-do-ze/cardapio");

    const chopps = res.body.data.secoes[0];
    const caipirinha = chopps.itens.find(
      (item: { descricao_produto: string }) =>
        item.descricao_produto === "Caipirinha de limão",
    );

    expect(caipirinha).toBeDefined();
    expect(caipirinha.disponivel).toBe(false);
    expect(res.body.data.total_indisponiveis).toBe(1);
  });

  it("exposes price and tags but not internal fields", async () => {
    await setupMenu();

    const res = await request(app).get("/api/v1/public/bares/boteco-do-ze/cardapio");
    const item = res.body.data.secoes[0].itens.find(
      (i: { preco: number }) => i.preco === 1490,
    );

    expect(item.tags).toEqual(["novidade"]);
    expect(item.codigo_produto).toBeUndefined();
    expect(item.bar_id).toBeUndefined();
  });

  it("returns 404 for an unknown bar", async () => {
    const res = await request(app).get("/api/v1/public/bares/nao-existe/cardapio");

    expect(res.status).toBe(404);
  });
});
