# Architecture decisions

## ADR 001 — User-token Supabase operations (accepted)

Use a per-request Supabase JS client with the public key and authenticated bearer token. API calls `auth.getUser(token)`, which verifies against Auth, then checks active membership. RLS is a second independent enforcement layer. No service-role key exists in application configuration. This costs Auth and membership round trips, but avoids trusting decoded claims or stale role claims. Supabase reference: https://supabase.com/docs/reference/javascript/auth-getuser and https://supabase.com/docs/guides/database/postgres/row-level-security.

## ADR 002 — Narrow database mutation RPCs (accepted)

Revoke table writes from ordinary roles. Explicit definer RPCs use empty search_path and auth.uid(), transactional inserts and append-only audit. This supports atomic onboarding and product dependencies without elevated API credentials. Membership writes wait for Packet 2's invitation/revocation design. No generic SQL executor is exposed.

## ADR 003 — Exact money (accepted)

BIGINT nonnegative kobo persisted; canonical decimal strings through Zod and SQL text casting at all application money boundaries. Browser formats via BigInt arithmetic. Initial price is per base unit. Unit multiplier is a positive signed 32-bit integer. Zero price is valid; negative, fractional and overflow values are invalid.

## ADR 004 — Scope and retry semantics (accepted)

Only onboarding is replay-safe in Packet 1: (actor_id, request_id) binds normalised name/result. Product creation is atomic but not idempotent, explicitly documented and never retried automatically. Durable operation idempotency and the ledger are Packet 2. A missing/unpermitted shop returns 403 uniformly to avoid revealing tenant existence; unknown API routes return 404. Registration without a session remains on authentication screen.

## ADR 005 — Runtime and deployment shape (accepted)

Pin Node 24.13.0 and pnpm 10.28.2, lock dependency resolution. Fastify 5 and Vite 8 are used with Node 24. Official compatibility references: https://fastify.dev/docs/latest/Guides/Migration-Guide-V5/ and https://vite.dev/guide/. Supabase CLI pinned in root development dependencies. Same-origin production routing is preferred; localhost Vite proxy needs no permissive CORS. All hosted operations are out of scope and require separate authorisation.

## ADR 006 — Compiler compatibility (accepted)

TypeScript 7.0.2 is incompatible with typescript-eslint 8.71.1. TypeScript 6.0.3 also exposes a conflicting WebAuthn declaration in Supabase Auth 2.117.2. Pin TypeScript 5.9.3, which passes full application and dependency declaration checking (`skipLibCheck: false`). Do not suppress these errors or weaken strictness. Upgrade the compiler after upstream compatibility is verified.
