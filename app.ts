import express from "express";
import cors from "cors";
import path from "node:path";
import { errorHandler } from "./middleware/error-handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { productRoutes } from "./modules/product/product.routes.js";
import { uploadRoutes } from "./modules/upload/upload.routes.js";
import { barRoutes } from "./modules/bar/bar.routes.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";
import cookieParser from "cookie-parser";

const app = express();

const allowedOrigins = (process.env.APP_URL ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(path.resolve("uploads")));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/bars", barRoutes);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

export { app };
