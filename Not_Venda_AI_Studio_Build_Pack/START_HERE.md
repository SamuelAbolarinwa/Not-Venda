# AI Studio build pack: usage

Prepared 24 October 2026 from the verified migration baseline and Samuel's product/UX requirements. This is a target specification, not a certificate that the application works.

## Import safely

1. Import https://github.com/SamuelAbolarinwa/Not-Venda at `migration/ai-studio-baseline`, SHA `385ddf748203e3b837b4131e4c1b601879864049`.
2. Confirm apps/web, apps/api, packages/contracts, supabase and HANDOVER.md exist. Do not accept the default README-only main or Python prototype.
3. If AI Studio cannot select this branch, report that limitation. Use a verified export of this branch as an import source, or arrange a reviewed application default-branch transition externally. Do not force-push or merge unrelated histories merely to import.
4. Place this pack's seven Markdown files at the project root. Keep the existing HANDOVER.md and docs files. Treat this as a new documentation revision; do not silently overwrite a newer same-named specification.
5. Paste the startup prompt in AI_STUDIO_PROMPTS.md. Use the strongest reasoning-capable coding model available in your AI Studio account for initial migration/architecture work; record its exact selected name. This does not change the product's runtime LLM provider.
6. Return its report for external review. For subsequent stages use the continuation template and select one stage explicitly. Independent visual Stage 2 can proceed while external database setup is blocked, but dependent features cannot pass without real verification.

## Files

- PROJECT_SPEC.md: scope, environment, requirements and engineering invariants.
- UX_SPEC.md: screen behaviour, rapid checkout, error/offline states and accessibility.
- IMPLEMENTATION_PLAN.md: stages and evidence gates.
- PROJECT_STATUS.md: durable resume state and evidence table.
- DECISIONS.md: retained choices, proposed defaults and pending questions.
- AI_STUDIO_PROMPTS.md: startup, continuation, verification and recovery prompts.
- START_HERE.md: this guide.

## Credentials and database setup

Supply Supabase URL and publishable key as environment configuration. Secret/service-role keys bypass RLS and are not needed for ordinary user-scoped operations. Sensitive external API keys belong in server-side Secrets, never source or chat. A public key is not schema-administration access. Generate versioned SQL migrations even if someone applies them through another tool; record project identity, migration versions and actual results. Do not claim tables were created merely because SQL was generated.

For any hosted development database, identify whether data exists, list exact mutations/fixtures and get approval of that target/change set. Do not apply the local seed to an arbitrary live project. Set the correct application site/redirect URLs for Auth and test real confirmation/recovery in that environment.

## Provenance and current capability references

Baseline source: https://github.com/SamuelAbolarinwa/Not-Venda/tree/migration/ai-studio-baseline
Handover: https://github.com/SamuelAbolarinwa/Not-Venda/blob/385ddf748203e3b837b4131e4c1b601879864049/HANDOVER.md
Existing plan and partner contract: docs/implementation-plan.md and docs/partner-api.md at that SHA.
Google Build documentation: https://ai.google.dev/gemini-api/docs/aistudio-build-mode
Google full-stack documentation: https://ai.google.dev/gemini-api/docs/aistudio-fullstack
Supabase security: https://supabase.com/docs/guides/database/secure-data

Earlier source retrieval confirmed these Google pages document GitHub import/sync, Node runtime and external database/secrets support. No claim is made that schema administration, CLI, branch selection or every test tool is available in Samuel's account. Probe and report those separately. Google-like styling is a product preference, not affiliation with Google.
