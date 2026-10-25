# Prompts for Google AI Studio

## Model selection

For startup, ledger/security and final verification select the strongest reasoning-capable coding model actually offered by the account; record its exact name. For bounded visual implementation a faster coding model may be used after the specification is loaded. Do not invent unavailable model labels. Ask the supervising engineer to select among visible options if necessary; no provider change is needed merely to switch the development model.

## Startup — paste after importing the actual branch and files

You are continuing Not-Venda from an existing implementation, with Samuel as product owner and an external engineer reviewing architecture, UX and evidence.

Read START_HERE.md, PROJECT_SPEC.md, UX_SPEC.md, IMPLEMENTATION_PLAN.md, PROJECT_STATUS.md, DECISIONS.md, HANDOVER.md and applicable AGENTS.md. Inspect the actual project. Do not start from memory or a new generic inventory template.

Expected baseline: repository SamuelAbolarinwa/Not-Venda, branch migration/ai-studio-baseline, commit 385ddf748203e3b837b4131e4c1b601879864049. Verify apps/web, apps/api, packages/contracts and supabase exist. Default main and Python PR #1 are not the application. Preserve the baseline and existing history.

Execute Stage 0 and Stage 1 only. This authorises migration adaptation, foundation corrections, disposable local/CI verification and source sync to an application working branch in this repository. Update any older AGENTS scope wording precisely to reflect this authorisation; preserve security rules. Do not deploy, mutate a hosted database or begin dependent ledger features automatically.

Explicitly test and report capabilities: branch import/sync, file access, Node/pnpm workspace, React preview, Fastify /v1 routing, secrets, outbound Supabase access, schema-management access, command/test runner and browser automation. An SDK connection does not prove CLI or schema-administration access. Do not substitute Firebase or custom authentication.

Preserve the existing user-token/RLS boundaries, integer-kobo contracts and transactional RPCs. Run real checks where possible; generate SQL migrations if execution is unavailable and record them BLOCKED. Use GitHub Actions/IDE as a practical alternative to blocked local Docker downloads. Do not repeatedly pull the same failing image.

Track requirement IDs, actual code, checks, outcomes, revision and evidence in PROJECT_STATUS.md. Mark mocks/layout checks separately from live integration. Never label unexecuted checks PASS. Do not weaken requirements to match implementation or fill live reports with fixture data.

If foundation integration is externally blocked, complete independent Stage 0/1 work, document the exact required external step and stop with a concrete resume action. Independent Stage 2 can be selected next without implying the foundation passed.

Report actual starting/current source state, selected model, capabilities, changes, executed results, outstanding blockers, sync status and next action. Keep secrets out of responses and Git.

## Continuation — replace [STAGE] before pasting

Continue Not-Venda at Stage [STAGE] of IMPLEMENTATION_PLAN.md. This authorises that stage's implementation and verification in the existing project, with source sync to the selected application working branch. Hosted mutations/deployment still need approval of a concrete target/change set.

First read PROJECT_STATUS.md, the selected stage, relevant PROJECT_SPEC.md and UX_SPEC.md sections, DECISIONS.md and applicable agent instructions. Inspect actual code and evidence. Briefly identify completed work, missing work and failed/blocked dependencies, then act without stopping for routine plan approval.

Implement the next coherent vertical slice. Fix demonstrated defects, run the checks appropriate to the changed behaviour, and update requirement-level evidence and durable next action. For this stage continue through independent work until acceptance criteria pass or an external dependency prevents progress. Do not bypass dependent gates, fake a completed API or downgrade security. Record actual model, branch/revision and sync result. Do not automatically advance to an unauthorised stage.

## Review and repair — use after a stage report

Review the selected stage against PROJECT_SPEC.md, UX_SPEC.md and IMPLEMENTATION_PLAN.md. Read PROJECT_STATUS.md and examine actual code plus test output. Treat the previous report as a claim to check.

Prioritise wrong money/units, broken permissions, cross-tenant leakage, duplicate commits, lost offline data, stale account/shop state, misleading success/receipts and blocked essential UX. Include failed paths, direct RPC access, concurrency and real database evidence where relevant.

For each defect record trigger, expected vs actual, impact, code location and reproduction. Fix issues within the authorised stage, add meaningful regressions, then rerun affected checks. Distinguish source findings from reproduced failures. Do not rewrite correct modules speculatively. Update statuses with evidence and report remaining gaps honestly.

## Recovery after forgotten context or interrupted work

Resume from PROJECT_STATUS.md and current repository state. Read the referenced specification IDs, decisions, selected stage and applicable agent instructions. Inspect git diff/status and unresolved tasks before editing. Preserve incomplete user work and unsynced operation data. Establish what actually executed rather than trusting the last chat response. Continue only the authorised stage, then save a coherent status checkpoint and sync it if available.

## Final acceptance review

Audit all requirement IDs and evidence at the final source revision. Verify actual user journeys with Auth/API/PostgreSQL, denied permissions, retries/concurrency, exact money/unit calculations, offline restart/reconnect and mobile interaction. Check migrations from clean and baseline schemas, actual generated types, imports/build/startup and secret/repository hygiene. Separate missing external integrations and proposed policy defaults from completed work.

Return READY FOR OWNER REVIEW only when core evidence supports it; list each remaining FAIL/BLOCKED requirement otherwise. Prepare the exact deployment target/migrations/configuration and rollback plan for Samuel's approval. A preview, passing build or self-written checklist alone is insufficient. Do not deploy automatically.
