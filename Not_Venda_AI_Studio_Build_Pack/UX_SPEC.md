# Not-Venda user experience specification

Read with PROJECT_SPEC.md. This describes target behaviour, not existing screens.

## Experience and navigation

Google-inspired clarity: light neutral surfaces, restrained primary colour, readable typography, consistent icons with labels, clear focus and modest rounded surfaces. Avoid decorative gradients, invented business statistics and animation that delays checkout. Dark mode is optional after core flows work. A recognisable original interface is preferable to copying Google branding.

UX-01: Desktop shell has a left navigation rail and top shop/account/connectivity context. Mobile uses compact navigation with Sell prominently available; owner administration lives behind a clearly labelled menu. Suggested destinations: Sell, Activity, Stock, Assistant, then owner Reports and Settings. Never expose unauthorised data through hidden routes or preloaded responses.
UX-02: Shop identity remains visible. Switching with a basket asks whether to retain it for the original shop or explicitly discard; never transfers it to the new shop. Pending operations stay attached to their original actor/shop. Role and monetary visibility follow server capabilities.
UX-03: Every screen has loading, empty, success, validation, forbidden and dependency-failure states. Distinguish 'no products' from 'could not load products'. Preserve safe input after failures and show a request reference for support. Colour never carries status alone.

## Access and onboarding

UX-04: Authentication offers sign-in, registration and recovery with accessible labels, password visibility and clear email-confirmation instructions. Do not reveal account existence unnecessarily. Session restoration shows a bounded loading state and a retry/sign-in recovery path.
UX-05: First shop asks for shop name; currency NGN/timezone Africa/Lagos are explained defaults. Invalid input remains editable. After uncertain submission show 'We are checking whether your shop was created' and a safe retry using the saved request. No endless spinner, new UUID on every click or stale-account result.
UX-06: First catalogue has a clear 'Add product' action and explains opening stock separately. Product existence is not stock receipt. Do not silently seed real shops with demonstration goods.

## Counter sales

UX-07: Sell opens quickly to pinned stable tiles, a search field, compact connectivity/pending indicator and basket access. Tile contains product name/variant and selling price; availability is current or explicitly last-known. Owner controls tile order. Adding a new product must not unexpectedly reshuffle a cashier's learned layout.
UX-08: Tap adds one configured sale unit. A quantity control supports repeated taps and direct entry. Piece/carton selection visibly updates the base-unit equivalent and total. Avoid long-press-only essential actions. No microphone interaction is needed for ordinary checkout.
UX-09: Desktop basket sits beside tiles; mobile basket uses a persistent summary and expandable sheet. Lines show item, unit, quantity, amount and remove control. Clear basket requires confirmation when non-empty. Back navigation should not silently erase a sale.
UX-10: Checkout presents the exact total and cash/transfer/POS choices. Cash is optimised for common use; entering tendered cash shows change without changing revenue. Split payment opens additional rows and shows remaining balance. Invalid/insufficient/excess non-cash allocations prevent submission with an inline explanation. Do not claim bank verification.
UX-11: The visible completion action clearly states its effect, e.g. 'Complete sale · ₦1,500'. Disable duplicate action while resolving it; preserve the idempotency key across retries. Successful receipt exposes 'New sale' as primary action. Keep receipt sharing/printing optional and scoped to the committed transaction.
UX-12: Online lost response shows 'Checking sale status'; check by operation key before retrying. Offline capture shows 'Saved on this device — pending sync', a provisional reference and pending count. Never display a confirmed receipt tick before server commit. Require an explicit optional offline-capture choice when the network state is uncertain; do not silently convert an unknown online request into a second operation.
UX-13: Sync centre lists pending/committed/needs-attention entries with product summary, capture time and actor/shop. Explain stale price, insufficient stock and revoked access individually. Retry with the original key; correction creates a reviewed replacement linked to the rejected record. Never ask staff to 'try again' by creating a fresh duplicate sale.

## Activity, returns and owner operations

UX-14: Activity filters by date, operator where permitted, method and status. Receipt detail shows immutable sold-line/unit/price snapshots and linked returns/corrections. Staff scope is restricted. Refund action is owner-only, selects original lines, remaining returnable quantities, condition and refund method, then previews the impact.
UX-15: Stock lists quantity by base unit, carton equivalent where configured, last update and low-stock state. Owner actions: purchase, opening balance, count, adjustment and archive. Adjustment requires reason and preview; never present an unexplained editable 'stock' field.
UX-16: Product form separates name/brand/variant, aliases, base unit, conversion and selling price. Show an example '1 carton = 12 pieces'. Keep cost private to owners. Before changing used unit/price definitions explain future vs historic effect.
UX-17: Purchases accept supplier optional, product/unit/quantity, total cost and payment source/method. Show stock and cash effects before commit. Expenses and withdrawals are separate short forms with reasons/categories and receipt references optional.
UX-18: Count flow: choose scope → capture consistent snapshot → enter independent physical quantities → compare → investigate intervening movements → confirm owner adjustment. Do not fill the physical count with expected quantity by default. Explain positive/negative difference neutrally.
UX-19: Cash close shows session identity, opening float, committed movements, pending-sync warning, expected cash, independent counted cash and discrepancy. Counts should be entered before revealing the comparison where practical. Owner can record explanation; confirmation cannot erase evidence or silently include later transactions.

## Assistant and WhatsApp setup

UX-20: Assistant accepts text and deliberate voice notes with record/stop/cancel/upload states. Show transcript, interpreted lines, unresolved items and running draft. Let the user correct a line or say 'change the mangoes to five'. Show whether a correction edits a pending draft or requests a reversal of a completed sale.
UX-21: Separate messages from transaction state. 'I sold three mangoes' is a proposed action until clarified and confirmed. 'What should I buy?' is a recommendation request, not a purchase. 'Read everything so far' summarises that draft's scope, not every historical receipt.
UX-22: Preview shows exact action kind, shop, items/units/quantities, totals and payment method; confirmation expires when relevant facts change. Unresolved ambiguities block commit. Error messages must not imply the model has repaired the database by conversation alone.
UX-23: Owner integration screen shows link status, identity verification steps, pending approvals and revoke action. Never show a WhatsApp link as working before its actual provider flow is connected. In-app assistant can be developed separately while the partner's channel is BLOCKED.

## Reports and settings

UX-24: Owner overview uses real committed data, clear date range/timezone, cash vs non-cash, returns and cost completeness. An empty shop shows explanations rather than fabricated charts. Clicking a total opens supporting receipts/movements. Restock suggestions show calculation inputs and uncertainty.
UX-25: Settings supports shop identity, members/invitations, prices/units, tile arrangement, cash sessions, integrations and account controls. Member changes explain capabilities, need confirmed owner authority and protect the last owner. Sign-out must explain unsynced records and preserve actor-bound recovery.

## Accessibility and performance acceptance

UX-26: Primary touch controls target at least 44×44 CSS pixels; use visible keyboard focus, semantic form labels, sensible reading order and screen-reader status announcements. Do not announce each keystroke or repeated tile tap excessively. Validate at 360px mobile width and a representative desktop viewport, with zoom and keyboard operation.
UX-27: Avoid horizontal scrolling for essential mobile actions; account for on-screen keyboard and bottom safe area. Preserve a visible basket summary. Cancel recording before leaving its screen or ask explicitly.
UX-28: Measure rather than invent timing. After initial load, tile/basket interaction should respond locally without awaiting a network round trip; server preview/commit remain authoritative. Record interaction timings and test with a throttled connection. Conduct a short Samuel walkthrough of adding ten mixed-unit lines, cash checkout, lost response and offline recovery before approving UX.

## Required walkthroughs

Record screenshots or observations for sign-in/recovery; owner setup; staff sell; carton/piece basket; split payment/change; lost-response recovery; shop/account switch; offline restart/reconnect; stock count; cash close; assistant ambiguity/correction/confirmation; revoked access; empty/error states. Demonstration data can verify visual layout only and must not be reported as live integration evidence.
