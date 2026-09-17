import { Router } from "express";
import { validate, validateQuery } from "../../middleware/validate.js";
import { authMiddleware, requireBar } from "../auth/auth.middleware.js";
import {
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema,
} from "./product.schema.js";
import * as productService from "./product.service.js";

export const productRoutes = Router();

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     tags: [Products]
 *     summary: Criar produto
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codigo_produto, descricao_produto, bar_id]
 *             properties:
 *               codigo_produto:
 *                 type: string
 *                 example: "CERV001"
 *               descricao_produto:
 *                 type: string
 *                 example: "Cerveja IPA 500ml"
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 default: ACTIVE
 *               foto_produto:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               thumb_produto:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               bar_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Sem bar selecionado ou bar diferente do usuário
 *       409:
 *         description: Código de produto duplicado neste bar
 */
productRoutes.post(
  "/",
  authMiddleware,
  requireBar,
  validate(createProductSchema),
  async (req, res) => {
    const product = await productService.create(req.body, req.barId!);
    res.status(201).json({ data: product });
  },
);

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     tags: [Products]
 *     summary: Listar produtos
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         description: Filtrar por status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por descrição
 *       - in: query
 *         name: bar_id
 *         schema:
 *           type: string
 *         description: Filtrar por bar
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Lista paginada de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 */
productRoutes.get(
  "/",
  validateQuery(listProductsQuerySchema),
  async (req, res) => {
    const result = await productService.list(
      (req as unknown as Record<string, unknown>).validatedQuery as Parameters<typeof productService.list>[0],
    );
    res.json(result);
  },
);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Buscar produto por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto encontrado
 *       404:
 *         description: Produto não encontrado
 */
productRoutes.get("/:id", async (req, res) => {
  const product = await productService.getById(req.params.id as string);
  res.json({ data: product });
});

/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Atualizar produto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codigo_produto:
 *                 type: string
 *               descricao_produto:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *               foto_produto:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               thumb_produto:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Produto atualizado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Sem bar selecionado
 *       404:
 *         description: Produto não encontrado ou de outro bar
 */
productRoutes.put(
  "/:id",
  authMiddleware,
  requireBar,
  validate(updateProductSchema),
  async (req, res) => {
    const product = await productService.update(
      req.params.id as string,
      req.body,
      req.barId!,
    );
    res.json({ data: product });
  },
);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Excluir produto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Produto excluído
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Sem bar selecionado
 *       404:
 *         description: Produto não encontrado ou de outro bar
 */
productRoutes.delete("/:id", authMiddleware, requireBar, async (req, res) => {
  await productService.remove(req.params.id as string, req.barId!);
  res.status(204).send();
});
