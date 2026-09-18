import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { registerAndLogin, createBar } from "./helpers.js";

async function setupBar(email = "cat@example.com", slug = "cat-bar") {
  const { cookie } = await registerAndLogin(email);
  const { bar, cookie: barCookie } = await createBar(cookie, "Cat Bar", slug);
  return { cookie: barCookie, barId: bar.id };
}

describe("POST /api/v1/categories", () => {
  it("creates a category with a slug derived from the name", async () => {
    const { cookie } = await setupBar();

    const res = await request(app)
      .post("/api/v1/categories")
      .set("Cookie", cookie)
      .send({ nome: "Chopps & Cervejas", ordem: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe("chopps-cervejas");
    expect(res.body.data.ordem).toBe(1);
  });

  it("rejects a duplicate category in the same bar", async () => {
    const { cookie } = await setupBar();

    await request(app)
      .post("/api/v1/categories")
      .set("Cookie", cookie)
      .send({ nome: "Drinks" });

    const res = await request(app)
      .post("/api/v1/categories")
      .set("Cookie", cookie)
      .send({ nome: "Drinks" });

    expect(res.status).toBe(409);
  });

  it("rejects a user without a selected bar", async () => {
    const { cookie } = await registerAndLogin("semcat@example.com");

    const res = await request(app)
      .post("/api/v1/categories")
      .set("Cookie", cookie)
      .send({ nome: "Drinks" });

    expect(res.status).toBe(403);
  });
});

describe("GET /api/v1/categories", () => {
  it("lists categories ordered with the product count", async () => {
    const { cookie, barId } = await setupBar();

    await request(app)
      .post("/api/v1/categories")
      .set("Cookie", cookie)
      .send({ nome: "Porções", ordem: 2 });
    const drinks = await request(app)
      .post("/api/v1/categories")
      .set("Cookie", cookie)
      .send({ nome: "Drinks", ordem: 1 });

    await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        codigo_produto: "GIN001",
        descricao_produto: "Gin tônica",
        bar_id: barId,
        category_id: drinks.body.data.id,
      });

    const res = await request(app).get("/api/v1/categories").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.map((c: { nome: string }) => c.nome)).toEqual([
      "Drinks",
      "Porções",
    ]);
    expect(res.body.data[0]._count.products).toBe(1);
  });
});

describe("category ownership", () => {
  it("hides categories of another bar", async () => {
    const owner = await setupBar("owner-cat@example.com", "owner-cat-bar");
    const intruder = await setupBar("intruder-cat@example.com", "intruder-cat-bar");

    const created = await request(app)
      .post("/api/v1/categories")
      .set("Cookie", owner.cookie)
      .send({ nome: "Chopps" });

    const res = await request(app)
      .put(`/api/v1/categories/${created.body.data.id}`)
      .set("Cookie", intruder.cookie)
      .send({ nome: "Invadida" });

    expect(res.status).toBe(404);
  });

  it("keeps products when their category is deleted", async () => {
    const { cookie, barId } = await setupBar();

    const category = await request(app)
      .post("/api/v1/categories")
      .set("Cookie", cookie)
      .send({ nome: "Drinks" });

    const product = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        codigo_produto: "DRK001",
        descricao_produto: "Caipirinha",
        bar_id: barId,
        category_id: category.body.data.id,
      });

    const del = await request(app)
      .delete(`/api/v1/categories/${category.body.data.id}`)
      .set("Cookie", cookie);

    expect(del.status).toBe(204);

    const check = await request(app).get(`/api/v1/products/${product.body.data.id}`);
    expect(check.status).toBe(200);
    expect(check.body.data.category_id).toBeNull();
  });
});
