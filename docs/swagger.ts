import { fileURLToPath } from "node:url";
import swaggerJsdoc from "swagger-jsdoc";

const serverUrl = process.env.API_URL;

// As rotas sao lidas ao lado deste arquivo (modules/ em dev, dist/modules/ no
// build, modules/ dentro da funcao da Vercel), com a extensao em que ele roda.
const modulesDir = fileURLToPath(new URL("../modules/", import.meta.url));
const routesExt = import.meta.url.endsWith(".ts") ? "ts" : "js";

// Assets do Swagger UI via CDN, versao fixa + SRI: a funcao da Vercel nao
// empacota os arquivos estaticos do swagger-ui-dist, que o
// swagger-ui-express servia do node_modules.
const SWAGGER_UI_CDN = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.2";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TemNoBar API",
      version: "1.0.0",
      description: "API para gerenciamento de cardápio de bares",
    },
    servers: [
      {
        url: serverUrl,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Product: {
          type: "object",
          properties: {
            id: { type: "string" },
            codigo_produto: { type: "string" },
            descricao_produto: { type: "string" },
            status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
            foto_produto: { type: "string", nullable: true },
            thumb_produto: { type: "string", nullable: true },
            bar_id: { type: "string" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  apis: [`${modulesDir}**/*.routes.${routesExt}`],
});

export const swaggerHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TemNoBar API</title>
  <link rel="stylesheet" href="${SWAGGER_UI_CDN}/swagger-ui.css"
    integrity="sha384-F7uqyyVZgBbuOv+8gNy6ZGJB8Rf12CczPWm130Pxrau0cyZlj1Dl18cDOWpQSrGh"
    crossorigin="anonymous">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_UI_CDN}/swagger-ui-bundle.js"
    integrity="sha384-phexB4pLDnmX1PhMxW3Ojwp92jIrirblcgNHltMum/KEQzYuBelzyulhx5ALflmy"
    crossorigin="anonymous"></script>
  <script>
    SwaggerUIBundle({ url: "/docs/openapi.json", dom_id: "#swagger-ui" });
  </script>
</body>
</html>`;
