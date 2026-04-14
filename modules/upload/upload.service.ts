import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { createId } from "../../lib/id.js";
import { env } from "../../lib/env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const MAX_WIDTH = 1200;
const THUMB_WIDTH = 300;

function uploadBuffer(
  buffer: Buffer,
  publicId: string,
): Promise<{ secure_url: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { public_id: publicId, folder: "temnobar/products", format: "webp" },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result);
        },
      )
      .end(buffer);
  });
}

export async function processImage(buffer: Buffer) {
  const id = createId();

  const optimized = await sharp(buffer)
    .resize(MAX_WIDTH, undefined, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const thumb = await sharp(buffer)
    .resize(THUMB_WIDTH, undefined, { withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();

  const [main, thumbnail] = await Promise.all([
    uploadBuffer(optimized, id),
    uploadBuffer(thumb, `${id}_thumb`),
  ]);

  return {
    url: main.secure_url,
    thumb_url: thumbnail.secure_url,
  };
}
