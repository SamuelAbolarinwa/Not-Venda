# Complete implementation plan

Only Packet 1 is authorised. Entries below describe allocation, not completion. See progress.md for evidence.

## 1. Foundation and shop permissions.

Monorepo, pinned toolchain, environment setup, local Supabase, migrations, fixtures, generated database types and CI. Auth registration/confirmation, login/logout, recovery/update, restored sessions and protected application. Profiles, shops, active memberships, atomic replay-safe onboarding and selection. Catalogue products/variants/aliases, explicit unit conversions, initial versioned integer-kobo prices, audit. Owner/salesperson boundaries, RLS, tenant foreign keys, API validation/errors/logging/readiness, accessible mobile catalogue UI. Partner OpenAPI and planned integration contracts; real database and API tests. No sales or stock implementation.

## 2. Retail engine and authoritative ledger.

Append-only stock movements and monetary/payment ledger: opening balances, purchases in cartons, individual sales and basket lines, returns linked to original sale, expenses, owner withdrawals, physical counts and reasoned adjustments, cash closing/reconciliation. Atomic operations, stable idempotency keys and uncertain-response lookup. Price history and version-bound previews, rounding policy, cost/profit policy, corrections through reversals, negative-stock rules and unit changes. Staff invitations, verified acceptance, owner-only role changes, revocation/inactivation and last-owner protection with audit and concurrent permission tests are explicitly in this packet. Backend draft/preview/confirmation/commit/receipt primitives belong here; browser/WhatsApp use the same engine.

## 3. Counter PWA and offline synchronisation.

Installable mobile web app, fixed product tile positions (no automatic reshuffling), fast search, basket sales, cash/transfer/POS and mixed payment capture as agreed. Local durable outbox with per-operation IDs, clear pending/confirmed/failed states, retries and lookup after lost response. Reconcile stale price/stock/permission versions, service worker/update strategy, device data protection and reconnect handling. Offline capture never presents an uncommitted authoritative receipt. Web workflows for purchases, returns, expenses, withdrawals, stock counts and daily cash close.

## 4. Reporting and assistant/WhatsApp connection.

Owner reports for sales, margins under documented costing, stock, expenses, withdrawals, cash discrepancies and replenishment suggestions. No claim of theft detection or knowledge of unrecorded physical sales. In-app assistant and partner WhatsApp text/voice channel through restricted documented APIs: linked actor/shop, drafts, corrections, preview, explicit expiring version-bound confirmation, atomic commit, receipts, operation lookup. Linking approval/revocation, duplicate delivery and retries. Samuel owns backend/data; partner owns WhatsApp, speech and model orchestration. Initial model experimentation uses Groq (not Grok); official N-ATLAS speech remains a separate integration dependency. Models receive no unrestricted DB access. Integration authentication, webhook signatures, replay resistance, quotas, privacy and contract tests.

## 5. Deployment, hardening and handover.

Authorised staging/production Supabase and same-origin deployment, migration review/backup/recovery, SMTP and verified redirect/domain configuration, secret rotation, TLS/CSP/rate limits, operational monitoring and alerting. Load/accessibility/security testing, offline device matrix, end-to-end scenarios, data retention/export, owner/staff support and training. CI release gates, deployment rollback, incident runbooks, disaster recovery rehearsal, final Samuel/partner ownership and account handover.
