import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { registerAndLogin } from "./helpers.js";

describe("POST /api/v1/auth/register", () => {
  it("creates a user and sets a token cookie", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "new@example.com", password: "password123", name: "New User" });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("new@example.com");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects duplicate email", async () => {
    await registerAndLogin("dup@example.com");

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "dup@example.com", password: "password123", name: "Dup" });

    expect(res.status).toBe(409);
  });

  it("rejects missing fields", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "bad@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/v1/auth/login", () => {
  it("returns a token cookie for valid credentials", async () => {
    await registerAndLogin("login@example.com", "mypassword");

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "login@example.com", password: "mypassword" });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects wrong password", async () => {
    await registerAndLogin("login2@example.com", "correctpass");

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "login2@example.com", password: "wrongpass" });

    expect(res.status).toBe(401);
  });

  it("rejects non-existent email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@example.com", password: "whatever" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/auth/me", () => {
  it("returns the current user", async () => {
    const { cookie } = await registerAndLogin();

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("test@example.com");
  });

  it("rejects unauthenticated request", async () => {
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(401);
  });
});

describe("auth response payloads", () => {
  it("keeps the token out of the response body", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "nobody@example.com", password: "password123", name: "No Token" });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeUndefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects passwords shorter than 8 characters", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "short@example.com", password: "1234567", name: "Short" });

    expect(res.status).toBe(400);
  });

  it("never exposes password_hash when selecting a bar", async () => {
    const { cookie } = await registerAndLogin("select@example.com");

    const bar = await request(app)
      .post("/api/v1/bars")
      .set("Cookie", cookie)
      .send({ nome: "Select Bar", slug: "select-bar" });

    const res = await request(app)
      .post("/api/v1/auth/select-bar")
      .set("Cookie", cookie)
      .send({ bar_id: bar.body.data.id });

    expect(res.status).toBe(200);
    expect(res.body.user.bar_id).toBe(bar.body.data.id);
    expect(res.body.user.password_hash).toBeUndefined();
  });
});
