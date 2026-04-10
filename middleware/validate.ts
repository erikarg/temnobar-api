import type { RequestHandler } from "express";
import type { ZodType } from "zod/v4";

export function validate(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.parse(req.query);
    (req as unknown as Record<string, unknown>).validatedQuery = parsed;
    next();
  };
}
