import Fastify, { type FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  shopInput,
  createProductInput,
  pagination,
  uuid,
  shop,
  shopList,
  catalogueList,
  meResponse,
  product,
} from "@retail/contracts";
function makeClient(url: string, key: string, token?: string) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      fetch: (input, init) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(8000) }),
    },
  });
}
export interface Config {
  supabaseUrl: string;
  supabaseKey: string;
  logger?: boolean;
}
class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
function dbError(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === "42501")
    throw new HttpError(403, "FORBIDDEN", "Access denied");
  if (error.code === "PT409" || error.code === "23505")
    throw new HttpError(
      409,
      "CONFLICT",
      "The request conflicts with an existing record",
    );
  if (
    ["22023", "22003", "22P02", "23514", "23502", "23503"].includes(
      error.code ?? "",
    )
  )
    throw new HttpError(400, "INVALID_INPUT", "Invalid record values");
  throw new HttpError(
    503,
    "DATABASE_UNAVAILABLE",
    "The database could not complete the request",
  );
}
function output<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new HttpError(500, "INTERNAL_ERROR", "Invalid server response");
  return result.data;
}
export function buildApp(config: Config) {
  const app = Fastify({
    bodyLimit: 32768,
    requestIdHeader: false,
    genReqId: () => randomUUID(),
    logger: config.logger
      ? {
          redact: [
            "req.headers.authorization",
            "req.headers.cookie",
            'res.headers["set-cookie"]',
          ],
          serializers: {
            req: (r) => ({ method: r.method, url: r.url.split("?")[0] }),
            err: () => ({
              type: "Error",
              message: "Request failed",
              stack: "[redacted]",
            }),
          },
        }
      : false,
  });
  const client = (token?: string) =>
    makeClient(config.supabaseUrl, config.supabaseKey, token);
  app.addHook("onSend", async (req, reply, payload) => {
    reply.header("x-request-id", req.id);
    reply.header("cache-control", "no-store");
    return payload;
  });
  app.setErrorHandler((err, req, reply) => {
    const known = err instanceof HttpError;
    const status = known
      ? err.status
      : err instanceof z.ZodError
        ? 400
        : typeof err === "object" &&
            err !== null &&
            "statusCode" in err &&
            [400, 413, 415].includes(Number(err.statusCode))
          ? Number(err.statusCode)
          : 500;
    reply.status(status).send({
      code: known
        ? err.code
        : status === 400 || status === 415
          ? "INVALID_INPUT"
          : status === 413
            ? "PAYLOAD_TOO_LARGE"
            : "INTERNAL_ERROR",
      message: known
        ? err.message
        : status === 400 || status === 415
          ? "Check the supplied fields"
          : status === 413
            ? "Request is too large"
            : "Request could not be completed",
      request_id: req.id,
    });
  });
  app.setNotFoundHandler((req, reply) =>
    reply.code(404).send({
      code: "NOT_FOUND",
      message: "Route not found",
      request_id: req.id,
    }),
  );
  app.get("/health/live", async () => ({ status: "ok" }));
  app.get("/health/ready", async (_req, reply) => {
    try {
      const [auth, db] = await Promise.all([
        fetch(`${config.supabaseUrl}/auth/v1/health`, {
          headers: { apikey: config.supabaseKey },
          signal: AbortSignal.timeout(3000),
        }),
        client().from("shops").select("id").limit(0),
      ]);
      // Anonymous access is deliberately denied; permission denial still proves database reachability.
      const ready = auth.ok && (!db.error || db.error.code === "42501");
      return reply
        .code(ready ? 200 : 503)
        .send({ status: ready ? "ready" : "unavailable" });
    } catch {
      return reply.code(503).send({ status: "unavailable" });
    }
  });
  app.register(async (protectedApp) => {
    protectedApp.addHook("preHandler", async (req) => {
      const header = req.headers.authorization;
      if (!header || !/^Bearer \S+$/i.test(header))
        throw new HttpError(401, "UNAUTHENTICATED", "Sign in to continue");
      const db = client(header.slice(7));
      const { data, error } = await db.auth.getUser(header.slice(7));
      if (error || !data.user)
        throw new HttpError(
          error && error.status && error.status >= 500 ? 503 : 401,
          error && error.status && error.status >= 500
            ? "AUTH_UNAVAILABLE"
            : "UNAUTHENTICATED",
          "Session could not be verified",
        );
      req.retail = { db, user: data.user };
    });
    protectedApp.get("/v1/me", async (req) => {
      const { db, user } = req.retail;
      const [p, m] = await Promise.all([
        db.from("profiles").select("*").eq("id", user.id).single(),
        db
          .from("memberships")
          .select("*")
          .eq("user_id", user.id)
          .eq("active", true),
      ]);
      dbError(p.error);
      dbError(m.error);
      return output(meResponse, {
        user: { id: user.id, email: user.email ?? null },
        profile: p.data,
        memberships: m.data,
      });
    });
    protectedApp.get("/v1/shops", async (req) => {
      const { limit, offset } = pagination.parse(req.query);
      const { data, error } = await req.retail.db
        .from("shops")
        .select("*")
        .order("created_at")
        .order("id")
        .range(offset, offset + limit - 1);
      dbError(error);
      return output(shopList, { items: data, limit, offset });
    });
    protectedApp.post("/v1/shops", async (req, reply) => {
      const input = shopInput.parse(req.body);
      const { data, error } = await req.retail.db.rpc("create_shop", {
        p_request_id: input.request_id,
        p_name: input.name,
      });
      dbError(error);
      return reply.code(200).send(output(shop, data));
    });
    async function scope(req: FastifyRequest, ownerOnly = false) {
      const { shopId } = z.object({ shopId: uuid }).parse(req.params);
      const { data, error } = await req.retail.db
        .from("memberships")
        .select("role")
        .eq("shop_id", shopId)
        .eq("user_id", req.retail.user.id)
        .eq("active", true)
        .maybeSingle();
      dbError(error);
      if (!data || (ownerOnly && data.role !== "owner"))
        throw new HttpError(
          403,
          "FORBIDDEN",
          "You do not have permission for this shop",
        );
      return shopId;
    }
    protectedApp.get("/v1/shops/:shopId/catalogue", async (req) => {
      const shopId = await scope(req);
      const { limit, offset } = pagination.parse(req.query);
      const { data, error } = await req.retail.db
        .from("catalogue")
        .select("*")
        .eq("shop_id", shopId)
        .eq("archived", false)
        .order("created_at")
        .order("id")
        .range(offset, offset + limit - 1);
      dbError(error);
      return output(catalogueList, { items: data, limit, offset });
    });
    protectedApp.get("/v1/shops/:shopId/products/:productId", async (req) => {
      const shopId = await scope(req);
      const { productId } = z.object({ productId: uuid }).parse(req.params);
      const { data, error } = await req.retail.db
        .from("catalogue")
        .select("*")
        .eq("shop_id", shopId)
        .eq("id", productId)
        .maybeSingle();
      dbError(error);
      if (!data)
        throw new HttpError(404, "NOT_FOUND", "Product not found in this shop");
      return output(product, data);
    });
    protectedApp.post("/v1/shops/:shopId/products", async (req, reply) => {
      const shopId = await scope(req, true);
      const input = createProductInput.parse(req.body);
      const { data, error } = await req.retail.db.rpc("create_product", {
        p_shop_id: shopId,
        p_request_id: input.request_id,
        p_product: input.product,
      });
      dbError(error);
      return reply.code(201).send(output(z.object({ id: uuid }), { id: data }));
    });
  });
  return app;
}
declare module "fastify" {
  interface FastifyRequest {
    retail: {
      db: ReturnType<typeof makeClient>;
      user: import("@supabase/supabase-js").User;
    };
  }
}
