import { z } from "zod/v4";

export const createCategorySchema = z.object({
  nome: z.string().min(1).max(60),
  ordem: z.coerce.number().int().min(0).max(999).optional(),
});

export const updateCategorySchema = z.object({
  nome: z.string().min(1).max(60).optional(),
  ordem: z.coerce.number().int().min(0).max(999).optional(),
});
