import { writeFileSync } from "node:fs";
import { z } from "zod";
import {
  shopInput,
  createProductInput,
  shop,
  shopList,
  catalogueList,
  meResponse,
  product,
  errorEnvelope,
  uuid,
} from "../src/index";
const schema = (value: z.ZodType) =>
  z.toJSONSchema(value, { unrepresentable: "throw" });
const response = (value: z.ZodType, description = "Success") => ({
  description,
  headers: { "x-request-id": { schema: { type: "string", format: "uuid" } } },
  content: { "application/json": { schema: schema(value) } },
});
const errors = Object.fromEntries(
  [400, 401, 403, 404, 409, 413, 500, 503].map((code) => [
    String(code),
    response(errorEnvelope, "Safe error envelope"),
  ]),
);
const body = (value: z.ZodType) => ({
  required: true,
  content: { "application/json": { schema: schema(value) } },
});
const shopParam = {
  name: "shopId",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};
const pages = [
  {
    name: "limit",
    in: "query",
    schema: { type: "integer", minimum: 1, maximum: 100, default: 30 },
  },
  {
    name: "offset",
    in: "query",
    schema: { type: "integer", minimum: 0, maximum: 100000, default: 0 },
  },
];
const base = {
  openapi: "3.1.0",
  info: {
    title: "Kiosk foundation API",
    version: "1.0.0",
    description:
      "Implemented Packet 1 routes only. Money is canonical decimal-string kobo, maximum 9223372036854775807. Product POST is atomic but not idempotent. Shop POST replays by actor/request_id and normalised name. Authentication and current active membership are checked independently of client input.",
  },
  servers: [
    { url: "http://localhost:5173", description: "Vite same-origin proxy" },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "Supabase access token",
      },
    },
  },
};
const paths = {
  "/health/live": {
    get: {
      operationId: "liveness",
      security: [],
      responses: { 200: response(z.object({ status: z.literal("ok") })) },
    },
  },
  "/health/ready": {
    get: {
      operationId: "readiness",
      security: [],
      responses: {
        200: response(z.object({ status: z.literal("ready") })),
        503: response(z.object({ status: z.literal("unavailable") })),
      },
    },
  },
  "/v1/me": {
    get: {
      operationId: "currentUser",
      responses: { ...errors, 200: response(meResponse) },
    },
  },
  "/v1/shops": {
    get: {
      operationId: "listShops",
      parameters: pages,
      responses: { ...errors, 200: response(shopList) },
    },
    post: {
      operationId: "createShop",
      description:
        "Replay-safe by actor and body request_id. Same name replays; changed name conflicts.",
      requestBody: body(shopInput),
      responses: { ...errors, 200: response(shop) },
    },
  },
  "/v1/shops/{shopId}/catalogue": {
    get: {
      operationId: "listCatalogue",
      parameters: [shopParam, ...pages],
      responses: { ...errors, 200: response(catalogueList) },
    },
  },
  "/v1/shops/{shopId}/products/{productId}": {
    get: {
      operationId: "getProduct",
      parameters: [
        shopParam,
        {
          name: "productId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: { ...errors, 200: response(product) },
    },
  },
  "/v1/shops/{shopId}/products": {
    post: {
      operationId: "createProduct",
      description:
        "Owner-only atomic creation with aliases, units and initial per-base-unit price. Not replay-safe: no automatic POST retries.",
      parameters: [shopParam],
      requestBody: body(createProductInput),
      responses: { ...errors, 201: response(z.object({ id: uuid })) },
    },
  },
};
writeFileSync(
  "docs/openapi.json",
  JSON.stringify({ ...base, paths }, null, 2) + "\n",
);
