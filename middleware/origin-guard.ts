import type { RequestHandler } from "express";
import { ForbiddenError } from "../lib/errors.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Defesa contra CSRF: o cookie de sessao usa SameSite=None em producao, entao
// o navegador o envia em requisicoes cross-site. O preflight do CORS ja barra
// as chamadas JSON, mas requisicoes "simples" (multipart, form-urlencoded)
// passam sem preflight — essa checagem fecha essa brecha.
export function originGuard(allowedOrigins: string[]): RequestHandler {
  return (req, _res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();

    const origin = req.get("origin");
    // Clientes nao-browser (curl, apps nativos, testes) nao enviam Origin.
    if (!origin || allowedOrigins.includes(origin)) return next();

    throw new ForbiddenError("Origin not allowed");
  };
}
