import { z } from "zod/v4";

export const createProductSchema = z.object({
  codigo_produto: z.string().min(1).max(50),
  descricao_produto: z.string().min(1).max(255),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  foto_produto: z.string().nullish(),
  thumb_produto: z.string().nullish(),
  bar_id: z.string().min(1),
});

export const updateProductSchema = z.object({
  codigo_produto: z.string().min(1).max(50).optional(),
  descricao_produto: z.string().min(1).max(255).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  foto_produto: z.string().nullish(),
  thumb_produto: z.string().nullish(),
});

export const listProductsQuerySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  bar_id: z.string().optional(),
});
