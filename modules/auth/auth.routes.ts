import { Router, type CookieOptions } from "express";
import { validate } from "../../middleware/validate.js";
import { authMiddleware } from "./auth.middleware.js";
import { loginSchema, registerSchema, selectBarSchema } from "./auth.schema.js";
import * as authService from "./auth.service.js";

export const authRoutes = Router();
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

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
 *         description: Usuário criado com sucesso. O token JWT é enviado automaticamente via cookie httpOnly.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                user:
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: string
 *                    email:
 *                      type: string
 *                    name:
 *                      type: string
 *       409:
 *         description: Email já registrado
 */
authRoutes.post("/register", validate(registerSchema), async (req, res) => {
  const { user, token } = await authService.register(req.body);

  res.cookie("token", token, cookieOptions);

  return res.status(201).json({ user });
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
 *         description: Login realizado com sucesso. O token JWT é enviado automaticamente via cookie httpOnly.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           properties:
 *            user:
 *              type: object
 *       401:
 *         description: Credenciais inválidas
 */
authRoutes.post("/login", validate(loginSchema), async (req, res) => {
  const { user, token } = await authService.login(
    req.body.email,
    req.body.password,
  );
  res.cookie("token", token, cookieOptions);
  return res.json({ user });
});

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Dados do usuário autenticado
 *     security:
 *       - cookieAuth: []
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

/**
 * @swagger
 * /api/v1/auth/select-bar:
 *   post:
 *     tags: [Auth]
 *     summary: Vincular usuário autenticado a um bar
 *     description: Permite que um usuário autenticado selecione ou vincule-se a um bar existente.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bar_id]
 *             properties:
 *               bar_id:
 *                 type: string
 *                 description: ID do bar que o usuário deseja vincular
 *     responses:
 *       200:
 *         description: Usuário vinculado ao bar com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
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
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Bar não encontrado
 */
authRoutes.post(
  "/select-bar",
  authMiddleware,
  validate(selectBarSchema),
  async (req, res) => {
    const { bar_id } = req.body;

    const userId = req.user!.sub;

    const user = await authService.updateUser(userId, bar_id);

    return res.json({ user });
  },
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (limpar cookie)
 *     responses:
 *       200:
 *         description: Cookie removido
 */
authRoutes.post("/logout", (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  return res.json({ message: "Logged out" });
});
