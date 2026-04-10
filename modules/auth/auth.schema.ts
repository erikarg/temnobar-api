import { z } from "zod/v4";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
