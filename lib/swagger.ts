import path from "node:path";

import swaggerJSDoc from "swagger-jsdoc";

/** Scans route files for `@openapi` JSDoc. Requires `.ts` files on disk (build/CI), not only Vercel serverless bundles. */
export function buildOpenApiSpec(): object {
  return swaggerJSDoc({
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Education & commerce API",
        version: "1.0.0",
        description:
          "Educational videos, products, and orders. Authenticate with Bearer JWT from login or register.",
      },
      servers: [{ url: "/" }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Paste the access token from /api/auth/login or /api/auth/register",
          },
        },
        schemas: {
          UserPublic: {
            type: "object",
            properties: {
              id: { type: "string", description: "MongoDB ObjectId" },
              name: { type: "string" },
              email: { type: "string", format: "email" },
              role: { type: "string", enum: ["USER", "ADMIN"] },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          UserEnvelope: {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/UserPublic" },
            },
          },
          UsersEnvelope: {
            type: "object",
            properties: {
              users: {
                type: "array",
                items: { $ref: "#/components/schemas/UserPublic" },
              },
            },
          },
        },
      },
      security: [],
    },
    apis: [path.join(process.cwd(), "app", "api", "**", "*.ts")],
  }) as object;
}
