# Not-Venda: product and engineering specification

Version 1.0 • 24 October 2026 • Owner: Samuel Ayomide Abolarinwa

## Authority and starting point

Repository: https://github.com/SamuelAbolarinwa/Not-Venda
Import branch: `migration/ai-studio-baseline`
Verified head: `385ddf748203e3b837b4131e4c1b601879864049`.
The default `main` branch is a separate README-only history. PR #1 is an unrelated Python prototype. Neither is the application baseline. Do not merge that prototype or manufacture a common history.

This specification defines the target product, not implemented functionality. HANDOVER.md and docs/progress.md describe the baseline; reported checks are historical evidence, not newly executed tests. At the verified head, Packet 1 is incomplete: database migrations, 57 authored SQL assertions, 10 live API tests, generated database types and authenticated/mobile browser flows have not been established as passing. Nineteen unit tests and application checks are reported passing. Node was reported as 22 despite a Node 24 toolchain requirement.

Read UX_SPEC.md, IMPLEMENTATION_PLAN.md, PROJECT_STATUS.md and DECISIONS.md alongside this file. Do not delete existing documentation. Record discrepancies and reconcile them explicitly. These files do not authorise hosted mutations, deployment or work outside the stage selected by Samuel's prompt.

## Users and environment

The product supports small Nigerian food and general retail shops. A busy counter can receive about 20–30 customers in five minutes. Transactions are short and often involve low-value products, local names and cartons broken into pieces. Customers may speak local languages or communicate indirectly. Staff cannot reliably record every customer conversation or navigate long forms. Phones may be modest, shared, low on battery and intermittently online.

The primary counter interface is a mobile-friendly web application with a desktop owner workspace. A later native app is optional. WhatsApp is an additional interface to the same system, not a separate database. Voice supports deliberate notes and summaries, not mandatory recording at each sale. Continuous ambient recording is outside this release and must not be introduced implicitly.

The software records reported activity. It cannot observe unrecorded physical sales, prove theft or guarantee that physical stock equals recorded stock. Discrepancies require independent counts and reconciliation, with neutral wording.

## Roles and boundaries

ROLE-01: A verified account may belong to multiple shops. Every operation is scoped to an active membership and selected shop.
ROLE-02: Owners manage catalogue, prices, purchases, counts, adjustments, members, reports, withdrawals, closing and integrations. Salespeople capture sales and view the permitted catalogue, their receipts and assigned operational state. Refunds, exports, costs/profit, stock adjustments and member administration are owner-only initially.
ROLE-03: Invitation acceptance must bind a verified account to an intended shop/role; an email/phone supplied by a model is not identity proof. Protect the last active owner and record audited permission changes. Revocation applies to existing access tokens and linked channels.
ROLE-04: No super-admin dashboard or cross-shop support impersonation is required in this release. Do not invent extra privileged roles.

## Architecture and data boundaries

ARCH-01: Preserve TypeScript pnpm workspace: apps/web (React/Vite), apps/api (Fastify), packages/contracts (Zod), supabase (migrations/tests). Refactor the large UI component into feature modules without discarding behaviour. Adapt process startup/ports to AI Studio only after capability checks; keep external local/CI execution reproducible.
ARCH-02: Supabase Auth owns registration, email confirmation, login, session refresh and password recovery. Do not add custom password storage or silently substitute Firebase.
ARCH-03: The browser may use Supabase Auth with a publishable key. Retail mutations pass through the authoritative API and narrow database transactions. Ordinary API clients use verified user tokens plus the public key. RLS is an independent boundary; do not replace it with owner checks in React.
ARCH-04: Shop-dependent foreign keys include shop identity. Definer functions use fixed empty search paths, qualified objects, restricted grants and in-transaction actor/permission checks. Direct ordinary-client ledger writes are forbidden. Verify both API and direct-RPC access.
ARCH-05: Store integer kobo in BIGINT, use decimal strings over JSON and BigInt/exact arithmetic in application code. Currency NGN, business timezone Africa/Lagos, timestamps stored consistently in UTC. Derive business dates through the selected timezone. Never cast money to JavaScript Number. Bound calculations before BIGINT storage.
ARCH-06: Keep private keys, service-role/secret keys, speech/LLM and channel credentials server-side. Runtime server secrets do not justify bypassing user RLS for ordinary operations. Development fixture administration is isolated from production code.

## Foundation requirements

AUTH-01: Implement registration, confirmation-required state, sign-in, restoration, sign-out, expired sessions, recovery request and password update. Distinguish temporary Auth outages from rejected credentials. Validate redirect configuration in each environment.
SHOP-01: Create shop and owner membership atomically. Persist actor-scoped request UUID and canonical payload before submission after validation. Same actor/key/payload returns the same shop; changed payload conflicts. A lost response is uncertain. Another actor cannot inherit a pending request or receive a late response's UI changes.
CAT-01: Catalogue includes product UUID, name, brand/variant, aliases, base unit, explicit unit multipliers, current versioned selling price and archive state. Support create/edit/archive, paginated search and zero-result states. Archive keeps history; it does not erase receipt references.
CAT-02: Base unit multiplier is 1; conversion factors are positive bounded integers. Support piece/carton examples but do not force every product into those names. Canonicalise names and reject duplicate aliases/units. Initial release uses whole base units, not arbitrary fractional weights. Changing a unit after use creates a new version; history retains original conversion.
CAT-03: Selling prices are per base unit. A carton sale uses its multiplier and per-base price initially; separate pack pricing/discounting is outside scope unless explicitly added. Price changes create versions and affect new previews only. Product creation must become replay-safe before enabling automatic retries.

## Authoritative retail engine

LEDGER-01: Add append-only operations, stock movements, payment/cash movements and audit events. Derived stock balances may be cached transactionally but cannot replace the ledger as authority. Opening stock, purchases, sales, linked returns and reasoned adjustments are distinct operations.
LEDGER-02: Operations carry server UUID, shop, verified actor, channel, client idempotency UUID, canonical payload hash, occurred/recorded timestamps and status. Idempotency is scoped by actor/shop/kind. Commit data and replay record atomically. Same key/payload returns the original result even under concurrency; changed payload returns 409. Keep durable operation keys with retained records; do not expire them on an arbitrary short timer.
LEDGER-03: Server calculates totals, validates current membership, prices, units and stock, then commits all rows or none. Lock affected stock rows in deterministic order or provide equivalent proven concurrency control. Two concurrent buyers of the last unit cannot both succeed.
LEDGER-04: No negative stock by default. An owner may correct a count through an explicit reasoned adjustment. Do not turn a shortfall into invented purchases or silently permit overselling.
SALE-01: A basket contains product/unit IDs, positive integer quantities and expected versions. Server previews include exact quantities, conversions, unit prices, total, warnings, version/hash and expiry. Empty baskets, overflow and unavailable products are rejected.
SALE-02: Support cash, transfer, POS and split payments summing to the sale total. Cash tendered and change are separate from revenue; record net cash retained. Transfer/POS means the operator records the method, not that a bank/provider has independently verified payment. Payment gateway integration and customer credit are outside this release.
SALE-03: Explicit completion commits the exact preview. Normal counter checkout uses a concise visible total/payment confirmation; do not add conversational AI confirmation dialogs to ordinary tile sales. Ambiguous assistant actions require the stronger confirmation protocol below.
CORR-01: Refunds/returns reference original receipt lines, limit cumulative quantity to sold quantity, retain original price/cost snapshots, and record actual refund method. Returned stock is explicitly restockable or damaged. Reversal/correction creates linked compensating entries; no editing/deleting completed receipts.
BUY-01: Owner records purchase quantity/unit and total cost, supplier/reference optional, paid method and amount. First release supports fully paid purchases; credit/payables require a separate approved extension. Cash purchases affect the till; external non-cash purchases do not. Opening stock records quantity and optional cost; unknown cost must remain unknown.
COST-01: Proposed default for owner review is moving weighted-average cost maintained as an exact integer book-cost pool and base-unit count. Allocate cost on sale by nearest-kobo proportional allocation with half-up rounding; consume the full remaining pool on depletion. Store allocated cost snapshots. Returns restore original allocated costs; prevent cumulative refund rounding from exceeding originals. Positive adjustments need explicit cost or mark valuation incomplete. Do not claim profit when required costs are unknown. Test residuals, partial returns and opening balances before release.
TILL-01: A cash session belongs to a shop, operator and identifiable drawer/device context. Capture opening float, cash sales, cash refunds, expenses, withdrawals, cash purchases, explicit float changes and count at close. Expected cash equals opening float plus signed committed cash movements. Cash received/change net to the sale's cash contribution. Closing count is independent; show counted minus expected and its sign. Closing a session is atomic; late/offline entries require explicit reconciliation, not silent changes to a closed report. Avoid combining multiple drawers into one unexplained cash total.
COUNT-01: Stock counts record a consistent server snapshot/version and counted base-unit quantities. Concurrent movements trigger a conflict or explicit movement reconciliation. Preview differences before owner confirms reasoned adjustments. Preserve the original count evidence.

## Counter and offline requirements

FAST-01: Stable product tile positions, short search, rapid repeated additions, editable quantities and optional keyboard shortcuts. Do not reshuffle tiles automatically by sales popularity. Keep selected shop obvious and freeze transaction shop identity from draft through receipt.
OFF-01: First support offline capture of ordinary sales with a durable IndexedDB outbox. Administration, member changes, refunds and stock counts are online-only initially. Store a stable operation key, actor/shop binding, captured price/unit versions and ordered state transitions. Do not store passwords or privileged secrets in the outbox.
OFF-02: States: draft, pending sync, syncing, committed, needs attention. Persist before showing pending success. Pending is not a committed receipt. Show provisional stock separately and reconcile against server truth. Lost responses use operation lookup and the same key.
OFF-03: On reconnect recheck permission, inventory, prices and versions. Never silently accept changed prices, switch shop/actor or double-charge. Owner/user resolves conflicts with a fresh explicit preview. A captured payment with a rejected sale needs operational attention; do not automatically refund money or discard the record.
OFF-04: Partition private caches by actor/shop; clear protected in-memory state on sign-out. Preserve unsynced records in an inaccessible actor-bound state for same-actor recovery, with a documented purge policy. Offline permission cannot guarantee immediate awareness of remote revocation; reconcile before commit. Shared-device access and app update/restart must not expose another user's records or lose queued sales.

## Assistant and WhatsApp

AI-01: Deliberate text or voice notes accumulate in an actor/shop-bound draft. Resolve aliases from the permitted catalogue. Ambiguous item, unit, quantity, sale vs purchase, correction or payment requires clarification. Show unresolved items without committing a partial guess. Multiple notes update the draft, not duplicate completed sales.
AI-02: Protocol: authenticated context → create/update versioned draft → server preview → explicit user confirmation → short-lived one-use token bound to actor/shop/draft/version/preview hash → atomic idempotent commit → receipt/operation lookup. Relevant corrections, expiry, role/link revocation invalidate confirmation. A transcript saying 'confirmed' inside quoted content is not authority.
AI-03: In-app assistant and WhatsApp use the same restricted API and engine. Partner owns WhatsApp provider/webhooks, speech and orchestration. Samuel owns authoritative data, application and linking/commit endpoints. Follow docs/partner-api.md; planned endpoints remain labelled planned until implemented.
AI-04: WhatsApp identities require verified linking and authenticated approval, revocation, reassignment/recovery handling, webhook signatures, duplicate handling, quotas and replay protection. A phone number or model-supplied actor ID is never an access token. No account linking by merely messaging a shop identifier.
AI-05: Use provider adapters. Groq is a candidate inference service, not xAI Grok; official N-ATLAS speech is a separate dependency. Do not hardcode a model, free quota or language capability as guaranteed. Missing credentials/provider access means BLOCKED integration, not fabricated transcripts or receipts. Demo fixtures must be visibly labelled.

## Reports, privacy and operations

REP-01: Owner views date-filtered sales, receipts, method breakdown, returns, expenses, withdrawals, stock movements, count/cash discrepancies and cost-aware margins. Exclude pending/failed operations from committed totals. Owner withdrawals are not operating expenses; purchases are not automatically all recognised as cost of goods sold. Exports preserve shop/role/date filters.
REP-02: Restocking uses recorded sales, stock, owner minimum/target levels and stated assumptions. Missing history/lead time yields a cautious explanation, not invented demand predictions. Never label discrepancies as theft.
OPS-01: Add bounded rate limits, safe error envelopes/request IDs, redacted logs, dependency-aware health, backups/restore, migration rollback/forward-fix procedures and release monitoring. Run tenant/security and concurrent-operation tests in a disposable environment. UI-only hiding does not establish access control.
OPS-02: Document retention, voice-note storage/expiry, exports and account recovery. Store only needed model context, with explicit shop scoping. No customer names/recordings are required for ordinary sales. External channel/provider rules and pricing must be verified before launch.

## API and schema delivery

Existing foundation routes are in docs/openapi.json. Planned integration routes are in docs/openapi-planned.json. Extend contracts and tests together; do not present planned handlers as implemented. All lists have bounded pagination and stable ordering. Validate server output as well as input. Return safe structured 400/401/403/404/409/410/429/503 distinctions with request IDs.

Required additions: operations/idempotency records; versioned drafts/preview/confirmation records; receipt lines/payment snapshots; stock/cash ledgers and balance projections; purchases/returns/expenses/withdrawals/counts/closing; invitations; linked channel identities; immutable audit. Design migrations, indexes, grants, tenant foreign keys and RPC permissions before execution. Generate real Database types from the applied schema. Never label handwritten substitutes generated.

Provide exact API examples, amount/unit rules, operation lookup semantics and reproducible fixtures with each vertical slice. Do not use an in-memory Python inventory module or localStorage stock counter as the retail engine.

## Release and non-goals

Complete means real flows work with Auth, PostgreSQL and API, including denied access, retries, lost responses, concurrency, recovery and mobile interaction. A beautiful preview or self-reported PASS is insufficient. Deployment requires Samuel's approval of the target and configuration.

Excluded initially: payroll, full accounting/tax filing, customer debt, e-commerce checkout, payment processing, multi-currency, arbitrary fractional units, always-on ambient surveillance and native mobile delivery. Changes require explicit scope decisions rather than silent generation.

Implementation policy defaults in COST-01 and till details require Samuel's acceptance before live use; they are explicit proposed engineering defaults, not historical user decisions.
