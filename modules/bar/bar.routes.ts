import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authMiddleware } from "../auth/auth.middleware.js";
import { createBarSchema } from "./bar.schema.js";
import * as barService from "./bar.service.js";

export const barRoutes = Router();

/**
 * @swagger
 * /api/v1/bars:
 *   get:
 *     tags: [Bars]
 *     summary: Listar bares
 *     responses:
 *       200:
 *         description: Lista de bares
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       nome:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 */
barRoutes.get("/", async (_req, res) => {
  const bars = await barService.list();
  res.json({ data: bars });
});

/**
 * @swagger
 * /api/v1/bars:
 *   post:
 *     tags: [Bars]
 *     summary: Criar bar
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, slug]
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "Meu Bar"
 *               slug:
 *                 type: string
 *                 pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"
 *                 example: "meu-bar"
 *     responses:
 *       201:
 *         description: Bar criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nome:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Não autorizado
 *       409:
 *         description: Slug já existe
 */
barRoutes.post(
  "/",
  authMiddleware,
  validate(createBarSchema),
  async (req, res) => {
    const bar = await barService.create(req.body);
    res.status(201).json({ data: bar });
  },
);
