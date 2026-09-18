import { z } from "zod/v4";

// Vocabulario fechado: tag livre vira bagunca e quebra o filtro do cardapio publico.
export const PRODUCT_TAGS = [
  "sem-alcool",
  "low-abv",
  "vegetariano",
  "vegano",
  "sem-gluten",
  "autoral",
  "novidade",
] as const;

const tagSchema = z.array(z.enum(PRODUCT_TAGS)).max(PRODUCT_TAGS.length);

// Preco em centavos: dinheiro nunca trafega como float.
const precoSchema = z.coerce.number().int().min(0).max(9_999_999);

export const createProductSchema = z.object({
  codigo_produto: z.string().min(1).max(50),
  descricao_produto: z.string().min(1).max(255),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  foto_produto: z.string().nullish(),
  thumb_produto: z.string().nullish(),
  preco: precoSchema.default(0),
  tags: tagSchema.default([]),
  category_id: z.string().nullish(),
  bar_id: z.string().min(1),
});

export const updateProductSchema = z.object({
  codigo_produto: z.string().min(1).max(50).optional(),
  descricao_produto: z.string().min(1).max(255).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  foto_produto: z.string().nullish(),
  thumb_produto: z.string().nullish(),
  preco: precoSchema.optional(),
  tags: tagSchema.optional(),
  category_id: z.string().nullish(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const listProductsQuerySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  bar_id: z.string().optional(),
  category_id: z.string().optional(),
});
