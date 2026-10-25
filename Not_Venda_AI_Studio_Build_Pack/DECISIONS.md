# Migration decision register

This supplements docs/decisions.md. Do not erase existing ADRs. A proposed default is not an approved historical product decision.

| ID | State | Decision and reason |
|---|---|---|
| MIG-01 | Approved direction | Move development/preview to AI Studio; preserve source on GitHub and authoritative Supabase backend. Changing editor does not require discarding foundation. |
| MIG-02 | Approved | Use the published migration branch; keep unrelated Python PR separate. Default main is not the application. |
| MIG-03 | Retained | React/Vite + Fastify + shared contracts + PostgreSQL RLS/RPCs; adapt runtime packaging only after capability evidence. |
| MIG-04 | Retained | Supabase Auth, not custom authentication or silent Firebase substitution. |
| MIG-05 | Retained | Models interpret permitted data and draft actions; backend/database decide permissions, totals, commit and receipts. |
| MIG-06 | Approved direction | Google-inspired visual clarity; architecture/UX specified here, styling implementation delegated. Stable sales tiles and explicit transaction states take priority over decoration. |
| MIG-07 | Approved workflow | Persistent requirements/status/evidence files reduce dependence on conversation memory. PASS needs executed evidence of the relevant behaviour. |
| MIG-08 | Proposed default | Whole base units, no customer credit/payment processing or arbitrary fractional weights in initial release. Review scope additions explicitly. |
| MIG-09 | Proposed default | Moving weighted-average integer cost pool with half-up allocation and residual on depletion, as COST-01. Samuel reviews before live use. |
| MIG-10 | Proposed default | Separate cash sessions per identifiable drawer/operator context. Reject/resolve late closed-session entries explicitly. Confirm real shop practice before release. |
| MIG-11 | Retained boundary | Local/CI disposable tests are routine. Hosted schema/data changes and deployment need approval of the concrete target. Never infer a connected project is disposable. |
| MIG-12 | Pending verification | AI Studio GitHub sync, Node runtime and external Supabase connection are documented capabilities; current account/branch/CLI/test support must be observed and recorded. |

For each future change add date, request/defect, alternatives, chosen approach, affected requirement IDs, migration implications, approval where needed and verification. Do not relax a requirement merely because current code fails it.
