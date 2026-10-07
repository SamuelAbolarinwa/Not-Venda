# Retail foundation working rules

Implement only the packet currently authorised. Packet 1 is the current scope; do not build a sale or stock ledger yet. Preserve unrelated work. Never deploy, push or touch hosted databases without explicit authorisation.

- TypeScript pnpm workspace: React/Vite web, Fastify API, shared Zod contracts, Supabase PostgreSQL/Auth.
- Ordinary API requests use the verified user's access token and public Supabase key. Never use a service-role key to bypass shop permissions.
- Every shop request checks current active membership. Database RLS is an independent boundary. Never trust client actor IDs or JWT decoding alone.
- Money is integer kobo in BIGINT and canonical decimal strings on the wire. Never convert money to Number.
- Shop/product creation is transactional; onboarding uses actor-bound database replay. SECURITY DEFINER functions require fixed empty search_path, qualified objects, restricted grants and identity checks.
- Child product references include shop_id. Audit is append-only. No mutable stock field is authoritative.
- British English, NGN, Africa/Lagos. No invented statistics or claims to detect theft/unrecorded sales.
- Never log credentials or commit .env files. Local fixture credentials are explicitly disposable.

Use Node from `.nvmrc`, pnpm from `packageManager`. Commands: `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm db:start`, `pnpm db:reset`, `pnpm db:test`, `pnpm test:integration`, `pnpm db:types`.

Before handover: run available checks, document exact failures/blockers in docs/progress.md, update decisions and contracts, create a local Git checkpoint if possible. Never label an unexecuted test or CI workflow as passed. Real RLS tests cannot be substituted with mocks. Hosted migrations require review and authorisation; only local reset is routine.
