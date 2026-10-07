import { it, expect } from "vitest";
import { buildApp } from "./app";
it("serves liveness and rejects unauthenticated access with safe request IDs", async () => {
  const app = buildApp({
    supabaseUrl: "http://127.0.0.1:1",
    supabaseKey: "public-test",
  });
  expect((await app.inject("/health/live")).statusCode).toBe(200);
  const response = await app.inject({
    url: "/v1/me",
    headers: { "x-request-id": "attacker-controlled" },
  });
  expect(response.statusCode).toBe(401);
  expect(response.json()).toMatchObject({ code: "UNAUTHENTICATED" });
  expect(response.json().request_id).not.toBe("attacker-controlled");
  expect(response.headers["x-request-id"]).toBe(response.json().request_id);
  expect((await app.inject("/missing")).statusCode).toBe(404);
  expect((await app.inject("/health/ready")).statusCode).toBe(503);
  await app.close();
});

it("rejects malformed and oversized bodies without exposing parser details", async () => {
  const app = buildApp({
    supabaseUrl: "http://127.0.0.1:1",
    supabaseKey: "public-test",
  });
  const malformed = await app.inject({
    method: "POST",
    url: "/v1/shops",
    headers: { "content-type": "application/json" },
    payload: "{",
  });
  expect(malformed.statusCode).toBe(400);
  expect(malformed.json().code).toBe("INVALID_INPUT");
  const large = await app.inject({
    method: "POST",
    url: "/v1/shops",
    headers: { "content-type": "application/json" },
    payload: JSON.stringify({ name: "x".repeat(40000) }),
  });
  expect(large.statusCode).toBe(413);
  expect(large.json().code).toBe("PAYLOAD_TOO_LARGE");
  await app.close();
});
