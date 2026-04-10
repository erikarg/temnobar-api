import swaggerJsdoc from "swagger-jsdoc";

const serverUrl = process.env.API_URL;

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
  apis: ["modules/**/*.ts"],
});
