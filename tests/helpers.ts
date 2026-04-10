import request from "supertest";
import { app } from "../app.js";

export async function registerAndLogin(
  email = "test@example.com",
  password = "password123",
  name = "Test User",
) {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password, name });
  return res.body.data as { user: { id: string; email: string; name: string }; token: string };
}

export async function createBar(
  token: string,
  nome = "Test Bar",
  slug = "test-bar",
) {
  const res = await request(app)
    .post("/api/v1/bars")
    .set("Authorization", `Bearer ${token}`)
    .send({ nome, slug });
  return res.body.data as { id: string; nome: string; slug: string };
}
