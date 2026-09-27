import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app.js";

describe("GET /docs", () => {
  it("serves the Swagger UI page with its assets pinned on a CDN", async () => {
    const res = await request(app).get("/docs");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("https://cdn.jsdelivr.net/npm/swagger-ui-dist@");
    expect(res.text).toContain('url: "/docs/openapi.json"');
  });

  it("serves the OpenAPI spec built from the route annotations", async () => {
    const res = await request(app).get("/docs/openapi.json");

    expect(res.status).toBe(200);
    expect(res.body.paths).toHaveProperty("/api/v1/auth/login");
    expect(res.body.paths).toHaveProperty("/api/v1/public/bares/{slug}/cardapio");
  });

  it("defines every security scheme the routes reference", async () => {
    const res = await request(app).get("/docs/openapi.json");

    const referenced = new Set<string>();
    for (const operations of Object.values(res.body.paths)) {
      for (const operation of Object.values(operations as Record<string, { security?: Record<string, string[]>[] }>)) {
        for (const requirement of operation.security ?? []) {
          for (const name of Object.keys(requirement)) referenced.add(name);
        }
      }
    }

    expect(referenced.size).toBeGreaterThan(0);
    for (const name of referenced) {
      expect(res.body.components.securitySchemes).toHaveProperty(name);
    }
  });
});
