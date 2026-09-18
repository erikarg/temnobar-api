import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authMiddleware, requireBar } from "../auth/auth.middleware.js";
import { createCategorySchema, updateCategorySchema } from "./category.schema.js";
import * as categoryService from "./category.service.js";

export const categoryRoutes = Router();

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Listar categorias do bar do usuário
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorias, com a contagem de produtos de cada uma
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Sem bar selecionado
 */
categoryRoutes.get("/", authMiddleware, requireBar, async (req, res) => {
  const categories = await categoryService.list(req.barId!);
  res.json({ data: categories });
});

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Criar categoria
 *     description: O slug é derivado do nome no servidor.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome]
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "Chopps"
 *               ordem:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Categoria criada
 *       409:
 *         description: Já existe categoria com esse nome no bar
 */
categoryRoutes.post(
  "/",
  authMiddleware,
  requireBar,
  validate(createCategorySchema),
  async (req, res) => {
    const category = await categoryService.create(req.body, req.barId!);
    res.status(201).json({ data: category });
  },
);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Atualizar categoria do próprio bar
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoria atualizada
 *       404:
 *         description: Categoria não encontrada ou de outro bar
 */
categoryRoutes.put(
  "/:id",
  authMiddleware,
  requireBar,
  validate(updateCategorySchema),
  async (req, res) => {
    const category = await categoryService.update(
      req.params.id as string,
      req.body,
      req.barId!,
    );
    res.json({ data: category });
  },
);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Excluir categoria do próprio bar
 *     description: Os produtos da categoria são mantidos e ficam sem categoria.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Categoria excluída
 *       404:
 *         description: Categoria não encontrada ou de outro bar
 */
categoryRoutes.delete("/:id", authMiddleware, requireBar, async (req, res) => {
  await categoryService.remove(req.params.id as string, req.barId!);
  res.status(204).send();
});
