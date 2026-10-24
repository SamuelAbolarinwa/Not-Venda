# Handover Document: Not-Venda Retail Foundation

**Project Baseline:** Packet 1 Foundation Checkpoint  
**Target Migration:** Google AI Studio  
**Date:** 24 October 2026  
**Authorised Repository:** `https://github.com/SamuelAbolarinwa/Not-Venda.git`  
**Base Application Commit:** `3757601703f88ad7622bdfa93d8d837b2a5bfd05`  
**Published Migration Branch:** `migration/ai-studio-baseline`

---

## 1. Actual Application Architecture & Directory Structure

The project is structured as a pnpm monorepo containing a React/Vite front-end, a Fastify REST API (`/v1`), shared Zod schema contracts, and Supabase PostgreSQL schema/migrations.

### Architectural Principles & Flow

- **Browser Client (`apps/web`):** Built with React 19 and Vite. Communicates directly with Supabase Auth for identity operations (sign-up, sign-in, email confirmation, password recovery) and proxies `/v1` requests through Vite to the Fastify API.
- **REST API (`apps/api`):** Fastify v5 application running on port 3001. Enforces authentication via Supabase Auth `getUser(token)` on every protected route. All database operations are executed using the caller's verified bearer token and the public publishable anon key. **No service-role key is configured or utilised in the API runtime.**
- **Permissions & Multi-Tenancy:** Two-layer defence boundary:
  1. The API verifies that the authenticated user holds an active membership for the target shop before proceeding.
  2. PostgreSQL Row-Level Security (RLS) independently verifies active membership on all queries via a private security-definer helper function (`private.is_member`).
- **Money Representation:** Strictly integer kobo in `BIGINT` (persisted in PostgreSQL), canonical decimal string on wire boundaries (`@retail/contracts`), and BigInt formatting in the browser (`formatNGN`). Currency is fixed to `NGN` (Nigerian naira), and timezone is fixed to `Africa/Lagos`. Floating-point numbers are never used for monetary values.
- **Mutations & Replay Safety:** Direct table writes are revoked for authenticated users. All mutations occur through narrow, transactional PostgreSQL functions (`public.create_shop` and `public.create_product`).
  - `create_shop` is replay-safe and idempotent via `(actor_id, request_id)` stored in `private.onboarding_requests`.
  - `create_product` is atomic across product, units, aliases, price, and audit records, but is not idempotent in Packet 1.

### Directory Structure

```
Not_Venda_Web_App/
├── .agents/                               # Custom agent rules & workflows
├── .codex/                                # Workspace context markers
├── .github/
│   └── workflows/
│       └── ci.yml                         # Authored GitHub Actions workflow
├── .gitignore                             # Excludes node_modules, dist, .env, .env.*
├── .nvmrc                                 # Pinned Node version (24.13.0)
├── .prettierignore
├── AGENTS.md                              # Retail foundation working rules
├── HANDOVER.md                            # This handover record
├── README.md                              # Architecture & local execution instructions
├── eslint.config.js                       # ESLint configuration
├── package.json                           # Workspace root scripts & dev dependencies
├── pnpm-lock.yaml                         # Resolved pnpm dependency lockfile
├── pnpm-workspace.yaml                    # Workspace packages declaration
├── tsconfig.json                          # Base TypeScript config (strict, TS 5.9.3)
├── apps/
│   ├── api/                               # Fastify REST API service
│   │   ├── .env.example                   # API environment template (public keys only)
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── app.ts                     # Fastify application routes & auth hooks
│   │   │   ├── app.test.ts                # Unit tests for liveness and error handling
│   │   │   ├── integration.test.ts        # Live integration tests (requires Supabase stack)
│   │   │   └── server.ts                  # Server entrypoint listening on PORT
│   │   └── dist/                          # Compiled Node ESM bundle
│   └── web/                               # React + Vite client application
│       ├── .env.example                   # Web environment template (public keys only)
│       ├── index.html                     # SPA entrypoint HTML
│       ├── package.json
│       ├── vite.config.ts                 # Vite config with proxy for /v1
│       └── src/
│           ├── main.tsx                   # Main React component & auth/catalogue view
│           ├── onboarding.ts              # Actor-bound onboarding persistence & validation
│           ├── onboarding.test.ts         # Unit tests for client-side onboarding recovery
│           ├── style.css                  # Foundation styles
│           └── vite-env.d.ts              # Vite environment typings
├── docs/
│   ├── architecture.md                    # Core architectural specification
│   ├── decisions.md                       # Architecture Decision Records (ADRs 001–008)
│   ├── implementation-plan.md             # Five-packet delivery plan (Packet 1 authorised)
│   ├── openapi.json                       # Generated OpenAPI specification
│   ├── openapi-planned.json               # Planned contracts for future packets
│   ├── partner-api.md                     # Partner integration specification
│   └── progress.md                        # Verification history and blocker diagnosis
├── packages/
│   └── contracts/                         # Shared Zod schemas & contracts package
│       ├── package.json
│       ├── scripts/
│       │   └── openapi.ts                 # OpenAPI generation script
│       └── src/
│           ├── contracts.test.ts          # Zod contract validation unit tests
│           └── index.ts                   # Core schemas: money, shop, product, pagination
├── scripts/
│   └── generate-types.mjs                 # Script to generate DB types via supabase gen types
└── supabase/
    ├── config.toml                        # Local Supabase CLI configuration
    ├── migrations/
    │   ├── 202610070001_foundation.sql    # Schema, RLS, profiles, shops, products, RPCs
    │   └── 202610080001_harden_product_rpc.sql # Hardened create_product RPC validation
    ├── seed.sql                           # Disposable demo fixtures (owner/staff/inactive)
    └── tests/                             # pgTAP database tests (permissions, atomicity)
        ├── atomicity.test.sql
        ├── permissions.test.sql
        ├── product_rpc_validation.test.sql
        └── revocation.test.sql
```

---

## 2. Implemented Functionality

### Core Features (Packet 1 Scope)

1. **User Authentication & Session Lifecycle:**
   - Registration with mandatory email confirmation state handling.
   - Password sign-in, session restoration, and graceful sign-out.
   - Password recovery trigger and recovery update view (`/?recovery=1`).
   - Session expiry interception on API requests (`401 UNAUTHENTICATED`), forcing local sign-out.
2. **Actor-Bound Shop Onboarding:**
   - Client-side pending state validated via Zod before persistence under `onboarding:v1:<actor_uuid>`.
   - Idempotent backend RPC (`public.create_shop`) with transaction-level advisory locks.
   - Safe recovery on network timeouts or ambiguous responses; form unlocks only on definitive validation error (`400 INVALID_INPUT`).
   - Automatic assignment of initial creator as shop `owner`.
3. **Catalogue & Product Management:**
   - Bounded catalogue pagination (max 30 items per page in UI, max 100 on API).
   - Owner-restricted product creation form supporting base units, carton multipliers, custom aliases, and integer-kobo prices.
   - Strict database-level input validation and canonicalisation in `create_product` RPC (rejecting unknown fields, enforcing multiplier bounds, canonical duplicate detection).
   - Atomic multi-table insertion (product, aliases, units, initial selling price, and audit record).
   - Security-invoker catalogue view casting `amount_kobo` to text prior to PostgREST JSON formatting.
4. **API Safety & Error Envelopes:**
   - Enforced 32 KiB request body limit and server-generated UUID request IDs.
   - Redacted logging (excluding authorization headers and cookies).
   - Standardised error envelope: `{ code, message, request_id }`.
   - Non-revealing `403 FORBIDDEN` for unpermitted or non-existent tenant resources to prevent shop enumeration.
   - Health endpoints: `/health/live` (liveness) and `/health/ready` (dependency check requiring both Auth and database reachability).

---

## 3. Latest Verification Results

### A. Checks Executed During This Handover Task (24 October 2026)

All lightweight static and unit verification checks pass completely:

| Check                  | Command             | Result     | Notes                                                                                                                        |
| ---------------------- | ------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Formatting**         | `pnpm format:check` | **PASSED** | Codebase matches Prettier style rules.                                                                                       |
| **Linting**            | `pnpm lint`         | **PASSED** | ESLint executed with 0 errors and 0 warnings.                                                                                |
| **Type Checking**      | `pnpm typecheck`    | **PASSED** | TypeScript 5.9.3 strict check with `skipLibCheck: false` passed with 0 errors.                                               |
| **Unit Tests**         | `pnpm test`         | **PASSED** | 19 tests passed across 3 suites (`onboarding.test.ts`, `contracts.test.ts`, `app.test.ts`).                                  |
| **Production Build**   | `pnpm build`        | **PASSED** | Built `@retail/contracts`, Fastify API ESM bundle (`apps/api/dist/server.js`), and Vite web client bundle (`apps/web/dist`). |
| **OpenAPI Generation** | `pnpm docs:api`     | **PASSED** | `packages/contracts/scripts/openapi.ts` cleanly output and verified OpenAPI specification.                                   |

### B. Historical Checks (Pre-existing Status)

- **Local Browser Smoke Test:** Unauthenticated sign-in screen previously verified to render with Email/Password fields and action controls. Live authenticated browser flows have not been verified against a running backend.
- **Database & Integration Verification:** Historical attempts failed due to local Docker image download timeouts (see Section 6).

---

## 4. Unverified Database & Browser Behaviour

In accordance with working rules, unexecuted behaviour is explicitly documented as unverified:

1. **Row-Level Security Enforcement:** 57 authored pgTAP assertions (`supabase/tests/*.test.sql`) test anonymous access denial, tenant cross-shop isolation, profile privacy, salesperson restrictions, and self-promotion prevention. **Zero pgTAP assertions have been executed against a running database.**
2. **Transactional RPC Execution:** The execution of `create_shop` and `create_product` functions, rollback on error, and audit record creation have not been exercised against a live PostgreSQL engine.
3. **End-to-End Authentication Flows:** Live registration email delivery, email link confirmation, session refresh, and password recovery redirect flows have not been verified in a browser against Supabase Auth.
4. **Catalogue Interaction:** Live pagination, shop switching, and real-time form submission in the browser remain unverified against a live database.
5. **Mobile Viewport Usability:** Layout has not been tested on physical touch devices or varied mobile screen dimensions.

---

## 5. Pending Migrations & Generated-Type Status

### Migration Status

Two SQL migrations are authored and committed in `supabase/migrations/`:

- `202610070001_foundation.sql`: Defines tables (`profiles`, `shops`, `memberships`, `products`, `product_aliases`, `product_units`, `selling_prices`, `audit_records`, `private.onboarding_requests`), triggers, RLS policies, and RPCs.
- `202610080001_harden_product_rpc.sql`: Hardens `public.create_product` with canonical string trimming, duplicate checks, array size constraints, and numeric bounds.

**Neither migration has been applied to a running local or hosted database instance.**

### Database Types Status

- `scripts/generate-types.mjs` is configured to run `supabase gen types typescript --local` and write to `packages/contracts/src/database.ts`.
- **Status:** `packages/contracts/src/database.ts` is currently **absent** because type generation requires a running local Supabase database (`GenTypesLocalDbNotRunningError`).
- The Fastify API and client currently operate using shared Zod contracts rather than generated database types. Generating and integrating `database.ts` into the request-scoped Supabase client is a required next step once the database is started.

---

## 6. Known Defects and Environment Blockers

1. **Docker Container Registry Download Blocker:**
   - Running `pnpm db:start` attempts to download `public.ecr.aws/supabase/postgres:17.11.0.004` (pinned by Supabase CLI `2.120.0`).
   - Network requests to AWS ECR from the local Docker daemon experience TLS handshake timeouts and TCP resets (`read: connection reset by peer`).
   - Consequently, `pnpm db:start`, `pnpm db:reset`, `pnpm db:test`, `pnpm test:integration`, and `pnpm db:types` are blocked in this local development environment.
2. **Node Runtime Version Discrepancy:**
   - Pinned Node version in `.nvmrc` and `package.json` engines is `24.13.0` (`>=24 <25`).
   - The current shell runs Node `v22.23.3`, which emits an engine warning during `pnpm` invocations (though all checks pass). A Node 24 runtime should be used when resuming.
3. **No Operation-Level Idempotency for Products:**
   - `create_product` is not replay-safe in Packet 1. If a network drop occurs during product creation, the client warns the user to inspect the catalogue rather than retrying blindly. Durable operation idempotency is scheduled for Packet 2.

---

## 7. Environment Variables & Setup Instructions

### Environment Variables

No credentials or secret values are required or permitted in Git.

#### API (`apps/api/.env`)

| Variable                   | Description                                            | Example / Default                   |
| -------------------------- | ------------------------------------------------------ | ----------------------------------- |
| `SUPABASE_URL`             | Local or staging Supabase API gateway URL              | `http://127.0.0.1:54321`            |
| `SUPABASE_PUBLISHABLE_KEY` | Public publishable / anon key (never service-role key) | _(Obtained from `supabase status`)_ |
| `PORT`                     | Local HTTP port for the Fastify server                 | `3001`                              |

#### Web Client (`apps/web/.env`)

| Variable                        | Description                   | Example / Default                   |
| ------------------------------- | ----------------------------- | ----------------------------------- |
| `VITE_SUPABASE_URL`             | Supabase API gateway URL      | `http://127.0.0.1:54321`            |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public publishable / anon key | _(Obtained from `supabase status`)_ |

_Note: Application code contains no service-role key variable. Elevated keys must never be placed in `.env` files or exposed to the web client bundle._

### Setup Instructions

1. Install Node `24.13.0` and pnpm `10.28.2`.
2. Install workspace dependencies:
   ```sh
   pnpm install --frozen-lockfile
   ```
3. Prepare environment files:
   ```sh
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```
4. Start Supabase (once container registry connectivity is healthy):
   ```sh
   pnpm db:start
   pnpm db:reset
   ```
5. Retrieve local credentials using `pnpm exec supabase status` and copy `API URL` and `anon key` into `apps/api/.env` and `apps/web/.env`.
6. Generate TypeScript database contracts:
   ```sh
   pnpm db:types
   ```
7. Start development servers:
   ```sh
   pnpm dev
   ```

---

## 8. External Services & Integration Boundaries

- **Supabase Auth:** External authentication authority handling email verification, password resets, and JWT issuance.
- **Supabase PostgREST / PostgreSQL 17:** Primary relational datastore running Row-Level Security.
- **Vite Development Proxy:** Proxies browser `/v1/*` requests to `http://127.0.0.1:3001` during local development to maintain same-origin semantics without requiring open CORS headers.
- **Google AI Studio (Target Migration):** Future destination for AI workspace orchestration and model interactions. All database and API contracts are designed to operate behind strict boundaries (no raw database access or elevated service-role privileges granted to external models).
- **Out-of-Scope Services (Packets 2–5):** WhatsApp integration, In-app AI assistants (Groq / N-ATLAS), payment processors, and hosted production databases are explicitly excluded from Packet 1.

---

## 9. Exact Steps Needed to Resume Work

1. **Switch to Target Environment & Node 24:**
   - Ensure Node.js `24.13.0` is active via `.nvmrc` (`nvm use` or equivalent).
2. **Resolve Docker Image Access:**
   - Ensure Docker daemon has unhindered outbound HTTPS access to AWS ECR (`public.ecr.aws`) and Docker Hub.
   - Pre-pull or allow Supabase CLI to pull `public.ecr.aws/supabase/postgres:17.11.0.004`.
3. **Initialise Local Database & Apply Migrations:**
   ```sh
   pnpm db:start
   pnpm db:reset
   ```
4. **Execute Authorised Database & Integration Tests:**
   ```sh
   pnpm db:test
   pnpm test:integration
   ```
5. **Generate Database Types:**
   ```sh
   pnpm db:types
   ```
   Commit the resulting `packages/contracts/src/database.ts` and bind the generated `Database` type to the request-scoped Supabase client in `apps/api/src/app.ts`.
6. **Verify Live Browser Flow:**
   - Launch `pnpm dev`.
   - Test sign-up, email confirmation link via Inbucket (`http://127.0.0.1:54324`), shop creation, and product creation in the UI (`http://localhost:5173`).
7. **Proceed to Packet 2:**
   - Consult `docs/implementation-plan.md` to begin Packet 2 (Retail Engine, append-only ledger, and operation-level idempotency).
