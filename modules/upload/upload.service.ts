import fs from "node:fs/promises";
import path from "node:path";
import { createId } from "../../lib/id.js";
import sharp from "sharp";

const UPLOADS_DIR = path.resolve("uploads/products");
const MAX_WIDTH = 1200;
const THUMB_WIDTH = 300;

async function ensureDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export async function processImage(buffer: Buffer) {
  await ensureDir();

  const id = createId();
  const filename = `${id}.webp`;
  const thumbFilename = `${id}_thumb.webp`;

  const filePath = path.join(UPLOADS_DIR, filename);
  const thumbPath = path.join(UPLOADS_DIR, thumbFilename);

  await sharp(buffer)
    .resize(MAX_WIDTH, undefined, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(filePath);

  await sharp(buffer)
    .resize(THUMB_WIDTH, undefined, { withoutEnlargement: true })
    .webp({ quality: 70 })
    .toFile(thumbPath);

  return {
    url: `/uploads/products/${filename}`,
    thumb_url: `/uploads/products/${thumbFilename}`,
  };
}
