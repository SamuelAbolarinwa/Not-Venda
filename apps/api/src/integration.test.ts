import { execFileSync } from "node:child_process";
import { randomUUID, createHmac } from "node:crypto";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { buildApp } from "./app";
// Local stack only. Do not accept arbitrary remote URLs or production credentials.
const status = JSON.parse(
  execFileSync("pnpm", ["exec", "supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
const url = String(status.API_URL);
if (!/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(url))
  throw Error("Tests require the disposable local Supabase stack");
const key = String(status.ANON_KEY);
const app = buildApp({ supabaseUrl: url, supabaseKey: key });
const shopA = "20000000-0000-4000-8000-000000000001",
  shopB = "20000000-0000-4000-8000-000000000002";
const tokens: Record<string, string> = {};
beforeAll(async () => {
  for (const account of [
    "owner.a",
    "staff.a",
    "owner.b",
    "staff.b",
    "inactive",
  ]) {
    const c = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await c.auth.signInWithPassword({
      email: `${account}@example.test`,
      password: "LocalDemoOnly123!",
    });
    if (error || !data.session) throw Error(`Fixture login failed: ${account}`);
    tokens[account] = data.session.access_token;
  }
}, 60000);
afterAll(() => app.close());
const headers = (who: string) => ({ authorization: `Bearer ${tokens[who]}` });
const product = {
  name: "Integration rice",
  base_unit: "piece",
  amount_kobo: "9007199254740993",
  aliases: ["test rice"],
  units: [
    { name: "piece", multiplier: 1 },
    { name: "carton", multiplier: 12 },
  ],
};
describe("real Supabase Auth, API and RLS", () => {
  it("rejects missing, invalid and genuinely signed expired credentials", async () => {
    expect((await app.inject("/v1/me")).statusCode).toBe(401);
    expect(
      (
        await app.inject({
          url: "/v1/me",
          headers: { authorization: "Bearer invalid" },
        })
      ).statusCode,
    ).toBe(401);
    // Read the local stack signing secret in memory only; never log it.
    const claims = Buffer.from(
      JSON.stringify({
        sub: "10000000-0000-4000-8000-000000000001",
        role: "authenticated",
        aud: "authenticated",
        exp: 1,
      }),
    ).toString("base64url");
    const unsigned = `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url")}.${claims}`;
    if (!status.JWT_SECRET)
      throw Error(
        "Local JWT_SECRET is required to test an expired signed token",
      );
    const expired = `${unsigned}.${createHmac("sha256", status.JWT_SECRET).update(unsigned).digest("base64url")}`;
    expect(
      (
        await app.inject({
          url: "/v1/me",
          headers: { authorization: `Bearer ${expired}` },
        })
      ).statusCode,
    ).toBe(401);
  });
  it("returns own profile and memberships", async () => {
    const r = await app.inject({ url: "/v1/me", headers: headers("owner.a") });
    expect(r.statusCode).toBe(200);
    expect(
      r
        .json()
        .memberships.every(
          (m: { user_id: string }) => m.user_id === r.json().user.id,
        ),
    ).toBe(true);
  });
  it("isolates shops and prices", async () => {
    const a = await app.inject({
      url: `/v1/shops/${shopA}/catalogue`,
      headers: headers("owner.a"),
    });
    expect(a.statusCode).toBe(200);
    expect(
      a.json().items.find((p: { name: string }) => p.name === "Golden Morn")
        .amount_kobo,
    ).toBe("150000");
    const b = await app.inject({
      url: `/v1/shops/${shopB}/catalogue`,
      headers: headers("staff.b"),
    });
    expect(b.statusCode).toBe(200);
    expect(
      b.json().items.find((p: { name: string }) => p.name === "Golden Morn")
        .amount_kobo,
    ).toBe("165000");
    for (const who of ["owner.a", "staff.a", "inactive"])
      expect(
        (
          await app.inject({
            url: `/v1/shops/${shopB}/catalogue`,
            headers: headers(who),
          })
        ).statusCode,
      ).toBe(403);
    expect(
      (
        await app.inject({
          url: `/v1/shops/${shopA}/catalogue`,
          headers: headers("inactive"),
        })
      ).statusCode,
    ).toBe(403);
  });
  it("rejects salesperson and cross-shop writes", async () => {
    for (const who of ["staff.a", "owner.b", "inactive"])
      expect(
        (
          await app.inject({
            method: "POST",
            url: `/v1/shops/${shopA}/products`,
            headers: headers(who),
            payload: { request_id: randomUUID(), product },
          })
        ).statusCode,
      ).toBe(403);
  });
  it("atomically creates products and preserves BIGINT money", async () => {
    const r = await app.inject({
      method: "POST",
      url: `/v1/shops/${shopA}/products`,
      headers: headers("owner.a"),
      payload: { request_id: randomUUID(), product },
    });
    expect(r.statusCode).toBe(201);
    const db = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${tokens["owner.a"]}` } },
      auth: { persistSession: false },
    });
    const { data, error } = await db
      .from("catalogue")
      .select("*")
      .eq("id", r.json().id)
      .single();
    expect(error).toBeNull();
    expect(data.amount_kobo).toBe(product.amount_kobo);
    expect(data.units).toHaveLength(2);
    expect(data.aliases).toHaveLength(1);
  });
  it("replays concurrent onboarding with one result and rejects changed input", async () => {
    const payload = {
      request_id: randomUUID(),
      name: `Test shop ${randomUUID()}`,
    };
    const responses = await Promise.all(
      [1, 2, 3].map(() =>
        app.inject({
          method: "POST",
          url: "/v1/shops",
          headers: headers("owner.a"),
          payload,
        }),
      ),
    );
    expect(responses.map((r) => r.statusCode)).toEqual([200, 200, 200]);
    expect(new Set(responses.map((r) => r.json().id)).size).toBe(1);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/v1/shops",
          headers: headers("owner.a"),
          payload: { ...payload, name: "changed" },
        })
      ).statusCode,
    ).toBe(409);
  });
  it("validates money, units and pagination", async () => {
    for (const change of [
      { amount_kobo: 1 },
      { amount_kobo: "-1" },
      { amount_kobo: "9223372036854775808" },
      { units: [{ name: "piece", multiplier: 0 }] },
    ])
      expect(
        (
          await app.inject({
            method: "POST",
            url: `/v1/shops/${shopA}/products`,
            headers: headers("owner.a"),
            payload: {
              request_id: randomUUID(),
              product: { ...product, ...change },
            },
          })
        ).statusCode,
      ).toBe(400);
    expect(
      (
        await app.inject({
          url: "/v1/shops?limit=101",
          headers: headers("owner.a"),
        })
      ).statusCode,
    ).toBe(400);
  });
  it("distinguishes a missing product from forbidden shop scope", async () => {
    const missing = await app.inject({
      url: `/v1/shops/${shopA}/products/${randomUUID()}`,
      headers: headers("owner.a"),
    });
    expect(missing.statusCode).toBe(404);
    const forbidden = await app.inject({
      url: `/v1/shops/${shopB}/products/${randomUUID()}`,
      headers: headers("owner.a"),
    });
    expect(forbidden.statusCode).toBe(403);
  });
  it("has dependency-aware readiness", async () =>
    expect((await app.inject("/health/ready")).statusCode).toBe(200));
});
