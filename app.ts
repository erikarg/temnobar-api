import express from "express";
import cors from "cors";
import path from "node:path";
import { errorHandler } from "./middleware/error-handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { productRoutes } from "./modules/product/product.routes.js";
import { uploadRoutes } from "./modules/upload/upload.routes.js";
import { barRoutes } from "./modules/bar/bar.routes.js";
import { categoryRoutes } from "./modules/category/category.routes.js";
import { publicRoutes } from "./modules/public/public.routes.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { originGuard } from "./middleware/origin-guard.js";

const app = express();

// Vercel/Proxy: necessario para o rate limit enxergar o IP real do cliente.
app.set("trust proxy", 1);

const allowedOrigins = (process.env.APP_URL ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// CSP desligada: a API responde JSON, e a politica padrao do helmet quebraria
// o Swagger UI servido em /docs.
app.use(helmet({ contentSecurityPolicy: false }));

app.use(
  cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(originGuard(allowedOrigins));
app.use(
  "/uploads",
  helmet.crossOriginResourcePolicy({ policy: "cross-origin" }),
  express.static(path.resolve("uploads")),
);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/bars", barRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/public", publicRoutes);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

export { app };
