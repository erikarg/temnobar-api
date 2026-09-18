import { Router } from "express";
import * as publicService from "./public.service.js";

export const publicRoutes = Router();

/**
 * @swagger
 * /api/v1/public/bares/{slug}/cardapio:
 *   get:
 *     tags: [Público]
 *     summary: Cardápio público do bar
 *     description: Sem autenticação. Itens esgotados aparecem na carta marcados como indisponíveis.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: boteco-do-ze
 *     responses:
 *       200:
 *         description: Cardápio agrupado por seção
 *       404:
 *         description: Bar não encontrado
 */
publicRoutes.get("/bares/:slug/cardapio", async (req, res) => {
  const data = await publicService.menuBySlug(req.params.slug as string);
  res.json({ data });
});
