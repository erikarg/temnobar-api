import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authMiddleware } from "./auth.middleware.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
import * as authService from "./auth.service.js";

export const authRoutes = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                     token:
 *                       type: string
 *       409:
 *         description: Email já registrado
 */
authRoutes.post("/register", validate(registerSchema), async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ data: result });
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                     token:
 *                       type: string
 *       401:
 *         description: Credenciais inválidas
 */
authRoutes.post("/login", validate(loginSchema), async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  res.json({ data: result });
});

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Dados do usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
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
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     bar_id:
 *                       type: string
 *                       nullable: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Não autorizado
 */
authRoutes.get("/me", authMiddleware, async (req, res) => {
  const user = await authService.getMe(req.user!.sub);
  res.json({ data: user });
});
