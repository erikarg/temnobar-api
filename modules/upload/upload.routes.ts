import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../auth/auth.middleware.js";
import { AppError } from "../../lib/errors.js";
import * as uploadService from "./upload.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new AppError(400, "INVALID_FILE", "Only image files are allowed"));
    }
  },
});

export const uploadRoutes = Router();

/**
 * @swagger
 * /api/v1/upload/image:
 *   post:
 *     tags: [Upload]
 *     summary: Upload de imagem de produto
 *     description: Recebe uma imagem, gera thumbnail em WebP e retorna as URLs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imagem processada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: "/uploads/products/abc123.webp"
 *                     thumb_url:
 *                       type: string
 *                       example: "/uploads/products/abc123_thumb.webp"
 *       400:
 *         description: Arquivo ausente ou tipo inválido
 *       401:
 *         description: Não autorizado
 */
uploadRoutes.post(
  "/image",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      throw new AppError(400, "MISSING_FILE", "No image file provided");
    }

    const result = await uploadService.processImage(req.file.buffer);
    res.json({ data: result });
  },
);
