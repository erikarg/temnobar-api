import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { registerAndLogin, createBar } from "./helpers.js";

async function setupBarAndAuth(
  email = "test@example.com",
  slug = "test-bar",
) {
  const { cookie } = await registerAndLogin(email);
  const { bar, cookie: barCookie } = await createBar(cookie, "Test Bar", slug);
  return { cookie: barCookie, barId: bar.id };
}

describe("POST /api/v1/products", () => {
  it("creates a product", async () => {
    const { cookie, barId } = await setupBarAndAuth();

    const res = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        codigo_produto: "PROD-001",
        descricao_produto: "Cerveja Pilsen",
        bar_id: barId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.codigo_produto).toBe("PROD-001");
    expect(res.body.data.status).toBe("ACTIVE");
  });

  it("rejects duplicate codigo_produto within same bar", async () => {
    const { cookie, barId } = await setupBarAndAuth();

    await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ codigo_produto: "DUP-001", descricao_produto: "Item 1", bar_id: barId });

    const res = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ codigo_produto: "DUP-001", descricao_produto: "Item 2", bar_id: barId });

    expect(res.status).toBe(409);
  });

  it("rejects missing required fields", async () => {
    const { cookie, barId } = await setupBarAndAuth();

    const res = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ bar_id: barId });

    expect(res.status).toBe(400);
  });

  it("rejects unauthenticated request", async () => {
    const res = await request(app)
      .post("/api/v1/products")
      .send({ codigo_produto: "X", descricao_produto: "Y", bar_id: "z" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/products", () => {
  it("lists products with pagination", async () => {
    const { cookie, barId } = await setupBarAndAuth();

    for (let i = 1; i <= 3; i++) {
      await request(app)
        .post("/api/v1/products")
        .set("Cookie", cookie)
        .send({ codigo_produto: `P-${i}`, descricao_produto: `Product ${i}`, bar_id: barId });
    }

    const res = await request(app).get("/api/v1/products?per_page=2");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(3);
    expect(res.body.meta.total_pages).toBe(2);
  });

  it("filters by status", async () => {
    const { cookie, barId } = await setupBarAndAuth();

    await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ codigo_produto: "ACT", descricao_produto: "Active", bar_id: barId, status: "ACTIVE" });

    await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ codigo_produto: "INA", descricao_produto: "Inactive", bar_id: barId, status: "INACTIVE" });

    const res = await request(app).get("/api/v1/products?status=ACTIVE");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].codigo_produto).toBe("ACT");
  });

  it("searches by description", async () => {
    const { cookie, barId } = await setupBarAndAuth();

    await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ codigo_produto: "C-1", descricao_produto: "Cerveja Pilsen", bar_id: barId });

    await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ codigo_produto: "C-2", descricao_produto: "Caipirinha", bar_id: barId });

    const res = await request(app).get("/api/v1/products?search=cerveja");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].descricao_produto).toBe("Cerveja Pilsen");
  });
});

describe("GET /api/v1/products/:id", () => {
  it("returns a single product", async () => {
    const { cookie, barId } = await setupBarAndAuth();

    const created = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ codigo_produto: "SINGLE", descricao_produto: "One Product", bar_id: barId });

    const res = await request(app).get(`/api/v1/products/${created.body.data.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.codigo_produto).toBe("SINGLE");
  });

  it("returns 404 for non-existent product", async () => {
    const res = await request(app).get("/api/v1/products/nonexistent-id");

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/v1/products/:id", () => {
  it("updates a product", async () => {
    const { cookie, barId } = await setupBarAndAuth();

    const created = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ codigo_produto: "UPD", descricao_produto: "Before", bar_id: barId });

    const res = await request(app)
      .put(`/api/v1/products/${created.body.data.id}`)
      .set("Cookie", cookie)
      .send({ descricao_produto: "After", status: "INACTIVE" });

    expect(res.status).toBe(200);
    expect(res.body.data.descricao_produto).toBe("After");
    expect(res.body.data.status).toBe("INACTIVE");
  });

  it("returns 404 for non-existent product", async () => {
    const { cookie } = await setupBarAndAuth();

    const res = await request(app)
      .put("/api/v1/products/nonexistent-id")
      .set("Cookie", cookie)
      .send({ descricao_produto: "Nope" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/v1/products/:id", () => {
  it("deletes a product", async () => {
    const { cookie, barId } = await setupBarAndAuth();

    const created = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ codigo_produto: "DEL", descricao_produto: "To Delete", bar_id: barId });

    const res = await request(app)
      .delete(`/api/v1/products/${created.body.data.id}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(204);

    const check = await request(app).get(`/api/v1/products/${created.body.data.id}`);
    expect(check.status).toBe(404);
  });

  it("returns 404 for non-existent product", async () => {
    const { cookie } = await setupBarAndAuth();

    const res = await request(app)
      .delete("/api/v1/products/nonexistent-id")
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
  });
});

describe("product ownership", () => {
  async function setupTwoBars() {
    const owner = await setupBarAndAuth("owner@example.com", "owner-bar");
    const intruder = await setupBarAndAuth("intruder@example.com", "intruder-bar");

    const created = await request(app)
      .post("/api/v1/products")
      .set("Cookie", owner.cookie)
      .send({
        codigo_produto: "OWNED",
        descricao_produto: "Owner product",
        bar_id: owner.barId,
      });

    return { owner, intruder, productId: created.body.data.id as string };
  }

  it("hides products of another bar from updates", async () => {
    const { intruder, productId } = await setupTwoBars();

    const res = await request(app)
      .put(`/api/v1/products/${productId}`)
      .set("Cookie", intruder.cookie)
      .send({ descricao_produto: "Hijacked" });

    expect(res.status).toBe(404);
  });

  it("hides products of another bar from deletion", async () => {
    const { intruder, productId } = await setupTwoBars();

    const res = await request(app)
      .delete(`/api/v1/products/${productId}`)
      .set("Cookie", intruder.cookie);

    expect(res.status).toBe(404);

    const check = await request(app).get(`/api/v1/products/${productId}`);
    expect(check.status).toBe(200);
  });

  it("rejects creating a product for another bar", async () => {
    const { owner, intruder } = await setupTwoBars();

    const res = await request(app)
      .post("/api/v1/products")
      .set("Cookie", intruder.cookie)
      .send({
        codigo_produto: "CROSS",
        descricao_produto: "Cross bar",
        bar_id: owner.barId,
      });

    expect(res.status).toBe(403);
  });

  it("rejects mutations from a user without a selected bar", async () => {
    const { cookie } = await registerAndLogin("nobar@example.com");

    const res = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        codigo_produto: "NOBAR",
        descricao_produto: "No bar",
        bar_id: "some-bar-id",
      });

    expect(res.status).toBe(403);
  });

  it("rejects state-changing requests from a disallowed origin", async () => {
    const { cookie, barId } = await setupBarAndAuth();

    const res = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .set("Origin", "https://evil.example.com")
      .send({
        codigo_produto: "CSRF",
        descricao_produto: "Cross site",
        bar_id: barId,
      });

    expect(res.status).toBe(403);
  });
});

describe("price, tags and availability log", () => {
  async function setupWithCategory() {
    const { cookie, barId } = await setupBarAndAuth("preco@example.com", "preco-bar");
    const category = await request(app)
      .post("/api/v1/categories")
      .set("Cookie", cookie)
      .send({ nome: "Chopps" });
    return { cookie, barId, categoryId: category.body.data.id as string };
  }

  it("stores price in cents, tags and category", async () => {
    const { cookie, barId, categoryId } = await setupWithCategory();

    const res = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        codigo_produto: "CERV010",
        descricao_produto: "Chopp Pilsen 500ml",
        bar_id: barId,
        preco: 1490,
        tags: ["low-abv", "novidade"],
        category_id: categoryId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.preco).toBe(1490);
    expect(res.body.data.tags).toEqual(["low-abv", "novidade"]);
    expect(res.body.data.category_id).toBe(categoryId);
  });

  it("rejects a tag outside the vocabulary", async () => {
    const { cookie, barId } = await setupWithCategory();

    const res = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        codigo_produto: "CERV011",
        descricao_produto: "Chopp",
        bar_id: barId,
        tags: ["promocao-relampago"],
      });

    expect(res.status).toBe(400);
  });

  it("rejects a category from another bar", async () => {
    const owner = await setupWithCategory();
    const intruder = await setupBarAndAuth("outro@example.com", "outro-bar");

    const res = await request(app)
      .post("/api/v1/products")
      .set("Cookie", intruder.cookie)
      .send({
        codigo_produto: "CERV012",
        descricao_produto: "Chopp",
        bar_id: intruder.barId,
        category_id: owner.categoryId,
      });

    expect(res.status).toBe(404);
  });

  it("toggles availability and records the change", async () => {
    const { cookie, barId } = await setupWithCategory();

    const created = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        codigo_produto: "CERV013",
        descricao_produto: "Chopp IPA",
        bar_id: barId,
      });

    const patched = await request(app)
      .patch(`/api/v1/products/${created.body.data.id}/status`)
      .set("Cookie", cookie)
      .send({ status: "INACTIVE" });

    expect(patched.status).toBe(200);
    expect(patched.body.data.status).toBe("INACTIVE");

    const history = await request(app)
      .get(`/api/v1/products/${created.body.data.id}/historico`)
      .set("Cookie", cookie);

    expect(history.status).toBe(200);
    expect(history.body.data).toHaveLength(2);
    expect(history.body.data[0].status).toBe("INACTIVE");
  });

  it("hides the status of a product from another bar", async () => {
    const owner = await setupWithCategory();
    const intruder = await setupBarAndAuth("intruso2@example.com", "intruso2-bar");

    const created = await request(app)
      .post("/api/v1/products")
      .set("Cookie", owner.cookie)
      .send({
        codigo_produto: "CERV014",
        descricao_produto: "Chopp Weiss",
        bar_id: owner.barId,
      });

    const res = await request(app)
      .patch(`/api/v1/products/${created.body.data.id}/status`)
      .set("Cookie", intruder.cookie)
      .send({ status: "INACTIVE" });

    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/products/health", () => {
  it("summarises what is missing in the menu", async () => {
    const { cookie, barId } = await setupBarAndAuth("saude@example.com", "saude-bar");

    await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        codigo_produto: "SEM001",
        descricao_produto: "Item sem preço e sem foto",
        bar_id: barId,
      });

    const comPreco = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        codigo_produto: "COM001",
        descricao_produto: "Item com preço",
        bar_id: barId,
        preco: 1200,
      });

    await request(app)
      .patch(`/api/v1/products/${comPreco.body.data.id}/status`)
      .set("Cookie", cookie)
      .send({ status: "INACTIVE" });

    const res = await request(app)
      .get("/api/v1/products/health")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.sem_preco).toBe(1);
    expect(res.body.data.sem_foto).toBe(2);
    expect(res.body.data.sem_categoria).toBe(2);
    expect(res.body.data.esgotados).toBe(1);
    expect(res.body.data.mais_esgotam[0].codigo_produto).toBe("COM001");
  });

  it("rejects a user without a selected bar", async () => {
    const { cookie } = await registerAndLogin("saudesembar@example.com");

    const res = await request(app)
      .get("/api/v1/products/health")
      .set("Cookie", cookie);

    expect(res.status).toBe(403);
  });
});
