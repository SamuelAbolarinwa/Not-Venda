# Architecture

Browser → same-origin `/v1` Fastify API → Supabase PostgREST/PostgreSQL, carrying the user's access token. Browser ↔ Supabase Auth for sign-up, sign-in, email recovery and refresh. Vite proxies `/v1` to port 3001 in development. No cross-origin API CORS is enabled. Production should route web/API through one origin.

The API authenticates each protected request with Auth `getUser(accessToken)` and then queries current active membership before shop operations. RLS independently checks active membership. A private definer helper queries memberships without policy recursion; it cannot accept an arbitrary actor. Profile reads are self-only. Membership reads are self/active-only; there is no membership write surface in Packet 1.

Tables use UUID identities and UTC timestamptz. NGN and Africa/Lagos are fixed foundation defaults. Products have stable identity, brand/variant, a base unit, archive flag and version. Units have positive integer base-unit multipliers. Aliases and prices carry composite shop/product foreign keys. Initial price is per base unit, BIGINT kobo. The security-invoker catalogue view casts money to text before JSON generation. No inventory quantity is stored on products.

Writes use narrow SQL RPCs with current-identity checks. `create_shop` locks an actor/request key, stores its normalised input and result, and atomically creates the owner. Matching retries replay; changed payloads conflict; revoked users cannot recover private results. `create_product` locks the active owner membership and creates product, units, aliases, initial price and audit as one transaction. Direct table writes are denied, including audit update/delete. Product POST is not replay-safe in Packet 1: no automatic retry; reload catalogue after uncertain response. Packet 2 introduces operation-level idempotency.

Future relationships: operation(shop, actor, idempotency key) → sale/purchase/return/count/expense/withdrawal/close → immutable stock and money ledger entries; lines reference (shop, product), unit multiplier snapshot and price version. Returns reference original sale lines. Draft versions bind an actor/shop and a complete preview; confirmation tokens bind exactly that version and expire. Receipts come only from committed operations. There are no fake transaction endpoints.

The API has bounded offset lists (100 maximum), 32 KiB request bodies, server-generated UUID request IDs, redacted minimal request logging, safe error envelopes, liveness and dependency-aware readiness. Auth/network calls have timeouts. Liveness does not assert database health. Readiness tests Auth and a PostgREST DB query; intentional anonymous permission denial proves database reachability.

The UI gates catalogue content on a verified/restored session, handles email-confirmation pending state, and requests current roles from the API. UI visibility is convenience, never authorisation. No dashboard statistics, sales, stock or offline sync are implemented.
