import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { registerAndLogin, createBar } from "./helpers.js";

describe("POST /api/v1/bars", () => {
  it("creates a bar", async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post("/api/v1/bars")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Meu Bar", slug: "meu-bar" });

    expect(res.status).toBe(201);
    expect(res.body.data.nome).toBe("Meu Bar");
    expect(res.body.data.slug).toBe("meu-bar");
    expect(res.body.data.id).toBeDefined();
  });

  it("rejects duplicate slug", async () => {
    const { token } = await registerAndLogin();
    await createBar(token, "Bar 1", "same-slug");

    const res = await request(app)
      .post("/api/v1/bars")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Bar 2", slug: "same-slug" });

    expect(res.status).toBe(409);
  });

  it("rejects invalid slug format", async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post("/api/v1/bars")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Bad Slug", slug: "Bad Slug!" });

    expect(res.status).toBe(400);
  });

  it("rejects unauthenticated request", async () => {
    const res = await request(app)
      .post("/api/v1/bars")
      .send({ nome: "No Auth", slug: "no-auth" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/bars", () => {
  it("lists bars", async () => {
    const { token } = await registerAndLogin();
    await createBar(token, "Bar A", "bar-a");
    await createBar(token, "Bar B", "bar-b");

    const res = await request(app).get("/api/v1/bars");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].nome).toBe("Bar A");
  });

  it("returns empty array when no bars exist", async () => {
    const res = await request(app).get("/api/v1/bars");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});
