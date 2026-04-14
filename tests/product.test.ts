import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { registerAndLogin, createBar } from "./helpers.js";

async function setupBarAndAuth() {
  const { cookie } = await registerAndLogin();
  const bar = await createBar(cookie);
  return { cookie, barId: bar.id };
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
