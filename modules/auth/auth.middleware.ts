import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../lib/env.js";
import { prisma } from "../../database/prisma.js";
import { ForbiddenError, UnauthorizedError } from "../../lib/errors.js";

export interface AuthPayload {
  sub: string;
  bar_id: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
      barId?: string;
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

// Resolve o bar do usuario no banco, e nao pela claim do token: o vinculo pode
// mudar via select-bar enquanto o token de 7 dias ainda esta valido.
export const requireBar: RequestHandler = async (req, _res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { bar_id: true },
  });

  if (!user?.bar_id) {
    throw new ForbiddenError("No bar selected");
  }

  req.barId = user.bar_id;
  next();
};
