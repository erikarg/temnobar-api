import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../lib/env.js";
import { UnauthorizedError } from "../../lib/errors.js";

export interface AuthPayload {
  sub: string;
  bar_id: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authMiddleware: RequestHandler = (req, _res, next) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = bearer ?? req.cookies.token;

  if (!token) {
    throw new UnauthorizedError("Missing token");
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    throw new UnauthorizedError("Invalid token");
  }
};
