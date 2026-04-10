import { describe, it, expect, afterAll } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import request from "supertest";
import sharp from "sharp";
import { app } from "../app.js";
import { registerAndLogin } from "./helpers.js";

function createTestImage(width = 800, height = 600) {
  return sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 0, b: 0 } },
  })
    .jpeg()
    .toBuffer();
}

const uploadsDir = path.resolve("uploads/products");

afterAll(async () => {
  const files = await fs.readdir(uploadsDir).catch(() => []);
  for (const file of files) {
    await fs.unlink(path.join(uploadsDir, file)).catch(() => {});
  }
});

describe("POST /api/v1/upload/image", () => {
  it("uploads an image and returns url + thumb_url", async () => {
    const { token } = await registerAndLogin();
    const imageBuffer = await createTestImage();

    const res = await request(app)
      .post("/api/v1/upload/image")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", imageBuffer, "test.jpg");

    expect(res.status).toBe(200);
    expect(res.body.data.url).toMatch(/\/uploads\/products\/.+\.webp$/);
    expect(res.body.data.thumb_url).toMatch(
      /\/uploads\/products\/.+_thumb\.webp$/,
    );

    const urlPath = path.join(path.resolve("."), res.body.data.url);
    const thumbPath = path.join(path.resolve("."), res.body.data.thumb_url);
    await expect(fs.access(urlPath)).resolves.toBeUndefined();
    await expect(fs.access(thumbPath)).resolves.toBeUndefined();

    const mainMeta = await sharp(urlPath).metadata();
    const thumbMeta = await sharp(thumbPath).metadata();
    expect(mainMeta.width).toBeLessThanOrEqual(1200);
    expect(thumbMeta.width).toBeLessThanOrEqual(300);
    expect(mainMeta.format).toBe("webp");
    expect(thumbMeta.format).toBe("webp");
  });

  it("rejects non-image file", async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post("/api/v1/upload/image")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("not an image"), "test.txt");

    expect(res.status).toBe(400);
  });

  it("rejects request without file", async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post("/api/v1/upload/image")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it("rejects unauthenticated request", async () => {
    const imageBuffer = await createTestImage();

    const res = await request(app)
      .post("/api/v1/upload/image")
      .attach("file", imageBuffer, "test.jpg");

    expect(res.status).toBe(401);
  });

  it("serves uploaded image via static route", async () => {
    const { token } = await registerAndLogin();
    const imageBuffer = await createTestImage();

    const uploadRes = await request(app)
      .post("/api/v1/upload/image")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", imageBuffer, "test.jpg");

    const imageRes = await request(app).get(uploadRes.body.data.url);
    expect(imageRes.status).toBe(200);
    expect(imageRes.headers["content-type"]).toMatch(/image/);

    const thumbRes = await request(app).get(uploadRes.body.data.thumb_url);
    expect(thumbRes.status).toBe(200);
  });
});
