# Kiosk retail foundation — Packet 1

React/Vite web + Fastify `/v1` API + Supabase Auth/PostgreSQL. Only foundation/catalogue functionality is implemented. Read [progress](docs/progress.md) for actual verification and [implementation plan](docs/implementation-plan.md) for later packets.

## Local run

Prerequisites: Node **24.13.0**, pnpm **10.28.2**, Docker running with your user allowed access. Use `.nvmrc` with your preferred Node manager; `corepack prepare pnpm@10.28.2 --activate` where Corepack is installed.

```sh
pnpm install --frozen-lockfile
pnpm db:start
pnpm db:reset
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm exec supabase status
# Copy ONLY API URL and public anon/publishable key into both .env files.
pnpm dev
```

Web: http://localhost:5173. API: http://127.0.0.1:3001. Local email inbox: http://127.0.0.1:54324. Studio: http://127.0.0.1:54323. Email confirmation is enabled locally; new registrations must follow the inbox link before getting a session. Recovery email redirects to `/?recovery=1`; the user chooses a new password. Demo accounts are already verified.

Local fixtures: `owner.a@example.test`, `staff.a@example.test`, `owner.b@example.test`, `staff.b@example.test`, `inactive@example.test`. All use disposable password `LocalDemoOnly123!`. Two isolated shops have Golden Morn at ₦1,500.00 and ₦1,650.00. **Never apply seed.sql to a hosted project.**

## Commands

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:reset          # explicitly --local; destroys only disposable local data
pnpm db:test           # real pgTAP permissions/constraint tests
pnpm test:integration  # real local Auth + PostgREST + Fastify tests; stack required
pnpm db:types          # regenerate tracked database types from local migrations
pnpm exec supabase migration new descriptive_name
pnpm exec supabase migration up --local
pnpm exec supabase stop
```

`pnpm dev` runs both apps. Vite proxies `/v1` to the API. The API build emits a Node ESM bundle; run it with `pnpm --filter @retail/api start` after configuration. Hosted deployment and routing belong to Packet 5. Environment files are ignored; `.env.example` files contain no credentials.

## Configuration

API `apps/api/.env`: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (public anon/publishable key), `PORT` (3001). Web `apps/web/.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (public only). Application code has no service key variable. Integration tests discover local public settings via CLI and never need production credentials. Public keys may appear in the web bundle; secret/service keys must never be put in VITE variables.

## Hosted staging later — approval required

Do not reset, seed or migrate any remote database now. After separate authorisation: identify a disposable staging project and owner; review every SQL migration and backup/recovery plan; configure Auth site/redirect URLs and SMTP; store credentials outside Git; link the approved project with `pnpm exec supabase link --project-ref APPROVED_REF`; inspect `pnpm exec supabase migration list` and `pnpm exec supabase db push --dry-run`; have the owner approve the exact migration diff; only then run `pnpm exec supabase db push`. Never include seed data, never run remote reset, and verify permissions with dedicated staging accounts after applying. Back up before destructive changes. Generated migrations, not dashboard edits, are the source of truth.
