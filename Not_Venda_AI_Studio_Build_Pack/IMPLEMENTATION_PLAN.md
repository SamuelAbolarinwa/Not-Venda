# Evidence-based implementation plan

## Working agreement

The baseline's AGENTS.md currently authorises Packet 1 only. Samuel's migration request authorises preservation, planning and AI Studio adaptation; it is not a blanket approval for production deployment or arbitrary hosted mutations. The startup prompt authorises Stage 0 and Stage 1 below. Stage 2 is independent interface work. Stages 3–7 require the continuation prompt selecting that stage; completing one stage does not automatically authorise all later stages. Keep existing five-packet history; the stages below are a migration-oriented execution plan, not claims that those packets passed.

At the start of each turn read PROJECT_STATUS.md, the current stage here, the relevant PROJECT_SPEC.md/UX_SPEC.md sections and existing agent instructions. Inspect actual code before deciding what is missing. Do not rely on conversation memory alone. Update status at each meaningful checkpoint and before ending.

For each requirement maintain: ID, relevant code path, test/check, outcome, tested commit or working-tree hash, evidence path, blocker, next action. PASS requires executed evidence for that requirement's scope. Unit/mock/layout PASS never establishes RLS/transaction/integration PASS. A BLOCKED result does not become PASS after repeated attempts. Preserve failures and history; correct stale claims explicitly.

Fix code defects within the selected stage, rerun affected checks, and perform a bounded regression check. Avoid unlimited self-review loops. If two attempts fail for the same external dependency, record diagnosis and move to independent tasks or a concrete environment fallback. Do not rewrite the entire platform or silently loosen tests to pass.

## Stage 0 — import and capability discovery

Requirements: ARCH-01/02/03/06 and baseline preservation.
1. Confirm the imported tree includes apps/web, apps/api, packages/contracts, supabase, HANDOVER.md and both migrations. Record imported SHA. Do not proceed from default main or Python PR.
2. Preserve baseline branch. Use a new ai-studio/build branch if selectable. Report if the integration supports only a default branch; prepare a safe proposed import method rather than overwriting main or forcing unrelated histories together.
3. Probe actual file editing, Node version, pnpm/workspace install, web preview, server runtime, /v1 routing, outbound Supabase access, secrets facility, GitHub push/pull/branch handling, command execution, test runner and browser automation. Report AVAILABLE, UNAVAILABLE or UNTESTED for each with evidence. Never claim CLI/admin capability because an SDK connection works.
4. Confirm what can create/apply Supabase schema. URL/public key permits ordinary application access, not schema administration. If CLI/management access is absent, generate reviewed migrations for external application. Identify the exact separate step required.
5. Match Node .nvmrc (24.13.0) and packageManager (pnpm 10.28.2), or document a proven compatible adaptation. package.json engines permit Node >=24 <25, rather than literally requiring only that patch. Do not mass-upgrade dependencies during import.

Exit: application tree verified, runnable preview or precise blocker, capability matrix and approved adaptation documented. No new hosted mutation during discovery.

## Stage 1 — preserve and verify the foundation

Requirements: AUTH-01, SHOP-01, ROLE-01/02, CAT foundation, ARCH boundaries.
1. Re-run available formatting/lint/type/unit/build/OpenAPI checks; compare generated files rather than assuming generation proves no drift.
2. Apply both migrations in a disposable environment; execute authored SQL and live API tests and fix failures. Include direct RPC validation, rollback, tenant isolation, actor-bound onboarding replay and same-token membership revocation.
3. Generate and integrate actual Database types, then verify regeneration stability. CI may export the generated file to bootstrap the missing tracked baseline.
4. Execute real registration/confirmation, sign-in/refresh/logout/recovery, owner/staff catalogue, invalid onboarding, uncertain-response retry, actor switching/late responses and mobile checks.
5. If AI Studio cannot run Supabase locally, use the existing GitHub Actions disposable stack or the IDE. Keep hosted development proposals separate and identify project/data/changes before Samuel authorises them.

Exit: real foundation evidence or granular BLOCKED entries. Product create remains non-idempotent at this stage; no automatic product POST retry yet. A blocked foundation does not prevent independent Stage 2 visual work, but blocks claims of verified live workflows and acceptance of dependent mutations.

## Stage 2 — complete interface and interaction coverage

Requirements: UX-01 through UX-28 as screen/interaction requirements.
Build the full shell and screen flows described in UX_SPEC.md using shared types and a segregated, explicitly labelled demonstration adapter only where backend work is absent. Keep existing live foundation connected when possible. Demonstration adapter must not activate as a silent fallback after a production error.

Deliver all routes, navigation, role presentations, counter interactions, forms, assistant draft states, reports, offline/sync centre, empty/error/loading states and mobile/keyboard layouts. Fixture report numbers must be labelled demonstration values. Unimplemented action buttons must clearly identify integration state and must not show fake saved receipts.

Exit: interaction walkthroughs and route inventory mapped to UX IDs; responsive evidence; accessible labels/focus; no dead controls disguised as working functionality. Samuel reviews UX. Integration requirements remain unpassed until later stages.

## Stage 3 — ledger, permissions and operation protocol

Requirements: LEDGER-01/04, SALE-01/03, CORR-01, BUY-01, COST-01, TILL-01, COUNT-01, ROLE-03, CAT-01/03, ARCH-04/05.
Draft schema/RPC/API contracts and migrations, reconcile policy defaults with DECISIONS.md, then implement vertical slices: opening stock/purchases → sale/receipt/payment → returns/reversals → expenses/withdrawals → counts/closing → members/versions. Include product mutation replay safety.

Before production use, demonstrate: 1 carton of 12 adds 12 base units; sale of 3 leaves 9; retry produces one receipt/movement; two concurrent sales cannot consume one remaining unit twice; rejected substeps roll back; return caps and cost rounding are exact; cross-shop/role forgery is denied; closed-session and count-version conflicts are explicit. Cash/non-cash totals reconcile exactly. Unknown cost never produces claimed profit.

Exit: relevant pgTAP/integration/concurrency tests pass on real PostgreSQL; API/contracts/types updated; immutable ledger and balance agreement checked; each module's allowed/denied roles verified.

## Stage 4 — connect all operational screens

Requirements: live CAT/SALE/CORR/BUY/TILL/COUNT/REP workflows and UX-07/19,24/25.
Replace each demonstration interaction with an actual typed API integration. Deliver draft/preview/commit/lookup semantics, receipt detail, catalogue management, stock/purchase/count/close/member forms and real filtered reports. Measure counter responsiveness with network delay. No browser-authoritative money or mutable stock balance.

Exit: real owner/staff end-to-end journeys, failure preservation, current permissions, shop switching and exact payment/change evidence. The production build must not fall back to fixture records.

## Stage 5 — offline counter and PWA

Requirements: OFF-01/04 and FAST-01, UX-12/13/25/27.
Implement durable IndexedDB queue, cached shell/catalogue, service-worker update policy, actor/shop isolation, lookup-before-retry and needs-attention resolution. Keep unsupported offline administrative actions visibly online-only.

Exit scenarios: offline save → app restart → reconnect; server commits but response drops; duplicate replay; different actor signs in; stale price/stock; remote revocation; simultaneous devices; queue storage failure; app update with pending data; closed cash session. Assert exactly one committed operation and no lost pending record. Show provisional references separately from authoritative receipts. Record device/browser coverage.

## Stage 6 — reports, assistant and partner integration

Requirements: REP-01/02, AI-01/05, UX-20/24.
Implement owner reports with ledger-backed drill-down and data-quality indicators. Add provider-independent in-app draft tooling, text input, deliberate voice input if real speech access is available, clarification, preview, expiring confirmation, commit and receipt recovery.

Publish stable partner contracts and fixtures independently of provider availability. Partner handles real WhatsApp provider, signature checks and speech/model orchestration. Verify linked actor scope, duplicate webhook delivery, replay resistance and revocation jointly. Missing provider credentials is an integration blocker, never permission to simulate successful production delivery.

Exit: recorded report reconciliation, ambiguous multi-note/correction scenarios, expired/changed confirmations and prohibited tools; real channel evidence where available, otherwise exact external blockers. In-app completion does not imply WhatsApp completion.

## Stage 7 — release review and deployment preparation

Requirements: OPS-01/02 and all prior release gates.
Run relevant complete regression on final source: static/unit/build, migration-from-clean, upgrade-from-baseline, real permission/transaction/integration/browser/offline/concurrency tests. Scan tracked files and history for secrets and generated cache/build/runtime data. Demonstrate backup restore and release rollback/forward-fix procedures. Record accessibility, performance and remaining limitations.

Prepare deployment target, exact migrations, SMTP/redirect configuration, secrets names, same-origin routing, monitoring, rate limits, backups, operational ownership and smoke-test plan. Samuel approves the concrete target/change set before deployment or hosted mutations. Do not silently select Firebase or create a new billable dependency.

Exit: all core requirements have evidence, unresolved blockers accepted explicitly or removed from release scope through a documented decision, Samuel approves UX and release. 'Build passes' alone never means product complete.

## End-of-turn report

State current stage, actual commit/branch, changed modules and why, checks executed with outcomes, requirements newly passed/failed/blocked, remaining independent work and exact next action. Record whether source has actually synced. Include CI links and relevant evidence paths; redact credentials and browser storage. Do not claim background monitoring or work after the turn ends.
