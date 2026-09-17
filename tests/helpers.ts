import request from "supertest";
import { app } from "../app.js";

function extractCookie(res: request.Response): string {
  const setCookie = res.headers["set-cookie"];
  if (!setCookie) return "";
  const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return raw.split(";")[0];
}

export async function registerAndLogin(
  email = "test@example.com",
  password = "password123",
  name = "Test User",
) {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password, name });
  const cookie = extractCookie(res);
  return {
    user: res.body.user as { id: string; email: string; name: string },
    cookie,
  };
}

// Espelha o fluxo real do app: criar o bar e, em seguida, vincular-se a ele.
// O select-bar reemite o token, entao devolvemos o cookie atualizado.
export async function createBar(
  cookie: string,
  nome = "Test Bar",
  slug = "test-bar",
) {
  const res = await request(app)
    .post("/api/v1/bars")
    .set("Cookie", cookie)
    .send({ nome, slug });

  const bar = res.body.data as { id: string; nome: string; slug: string };

  if (!bar?.id) return { bar, cookie };

  const selected = await request(app)
    .post("/api/v1/auth/select-bar")
    .set("Cookie", cookie)
    .send({ bar_id: bar.id });

  return { bar, cookie: extractCookie(selected) || cookie };
}
