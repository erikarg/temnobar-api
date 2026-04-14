import { describe, it, expect } from "vitest";
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

const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

describe("POST /api/v1/upload/image", () => {
  it.skipIf(!hasCloudinary)(
    "uploads an image and returns Cloudinary url + thumb_url",
    async () => {
      const { cookie } = await registerAndLogin();
      const imageBuffer = await createTestImage();

      const res = await request(app)
        .post("/api/v1/upload/image")
        .set("Cookie", cookie)
        .attach("file", imageBuffer, "test.jpg");

      expect(res.status).toBe(200);
      expect(res.body.data.url).toMatch(
        /^https:\/\/res\.cloudinary\.com\/.+\.webp$/,
      );
      expect(res.body.data.thumb_url).toMatch(
        /^https:\/\/res\.cloudinary\.com\/.+_thumb\.webp$/,
      );
    },
  );

  it("rejects non-image file", async () => {
    const { cookie } = await registerAndLogin();

    const res = await request(app)
      .post("/api/v1/upload/image")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("not an image"), "test.txt");

    expect(res.status).toBe(400);
  });

  it("rejects request without file", async () => {
    const { cookie } = await registerAndLogin();

    const res = await request(app)
      .post("/api/v1/upload/image")
      .set("Cookie", cookie);

    expect(res.status).toBe(400);
  });

  it("rejects unauthenticated request", async () => {
    const imageBuffer = await createTestImage();

    const res = await request(app)
      .post("/api/v1/upload/image")
      .attach("file", imageBuffer, "test.jpg");

    expect(res.status).toBe(401);
  });
});
