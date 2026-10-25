# Current project status

Updated: 24 October 2026. Documentation seed, not an execution report.

## Resume instructions

Current stage: Stage 0 — import/capability discovery.
Next action: import `migration/ai-studio-baseline`, verify tree/SHA, read HANDOVER.md and run the Stage 0 capability checks. Then execute the authorised Stage 1 work. Stage 2 visual work may be selected separately when database checks are blocked.

Source: https://github.com/SamuelAbolarinwa/Not-Venda/tree/migration/ai-studio-baseline
Baseline SHA: `385ddf748203e3b837b4131e4c1b601879864049`.
Current AI Studio working branch: NOT ESTABLISHED.
Last AI Studio synced commit: NOT ESTABLISHED.
Deployment: none verified.
Hosted project identity/mutation approval: NOT ESTABLISHED.

## Evidence register

| Item | State | Evidence / practical limit | Next action |
|---|---|---|---|
| Published application baseline | PASS | GitHub branch head independently matched baseline SHA; HANDOVER.md retrieved | Import that branch |
| Unit/static/build checks | REPORTED PASS | Baseline handover reports 19 tests plus format/lint/type/build/docs; not rerun by document author | Rerun in target runtime |
| Local database setup | BLOCKED | Prior Docker ECR downloads failed; no live result | Probe target/CI capability |
| 57 SQL assertions | BLOCKED | Authored; zero established as executed | Run disposable database suite |
| 10 live API tests | BLOCKED | Authored; zero established as executed | Run suite after schema applies |
| Generated Database types | NOT STARTED | File absent at baseline | Generate from actual schema |
| Authenticated/mobile browser flows | BLOCKED | No established live verification | Test with working Auth/API/DB |
| UI coverage and advanced operations | NOT STARTED | Only foundation screens currently reported implemented | Execute selected stages |
| Sales/stock ledger/offline/assistant/WhatsApp | NOT STARTED | Future work in baseline plan | Do not mislabel planned contracts implemented |

REPORTED PASS is historical provenance only, not an allowed new requirement outcome. New outcomes use NOT STARTED, IN PROGRESS, PASS, FAIL or BLOCKED.

## Capability matrix — fill with observations

| Capability | Availability | Evidence | Limitation / workaround |
|---|---|---|---|
| Branch import and source SHA | UNTESTED | — | — |
| GitHub push/pull and branch selection | UNTESTED | — | — |
| Node 24 and pnpm workspace | UNTESTED | — | — |
| React preview | UNTESTED | — | — |
| Fastify /v1 routing | UNTESTED | — | — |
| Secrets settings | UNTESTED | — | — |
| Supabase Auth/Data API network | UNTESTED | — | — |
| Supabase CLI/schema management | UNTESTED | — | Separate SDK access from administration |
| Database/CI test execution | UNTESTED | — | — |
| Browser automation | UNTESTED | — | — |

## Requirement evidence table — extend, do not replace with a percentage

| Requirement | State | Code paths | Executed check/result | Tested revision | Evidence | Blocker / next step |
|---|---|---|---|---|---|---|
| AUTH-01 | BLOCKED | apps/web, apps/api | No live run established | baseline | HANDOVER.md §4 | Establish Auth test environment |
| SHOP-01 | IN PROGRESS | onboarding.ts, migrations | Helper tests reported; live replay pending | baseline | HANDOVER.md | Real replay/account-switch tests |
| ARCH-04 | BLOCKED | supabase/migrations, tests | SQL authored, unexecuted | baseline | docs/progress.md | Apply and test RLS/RPCs |

## Decision requests

- Review COST-01 weighted-average cost proposal before live use.
- Confirm drawer/session policy for multiple simultaneous cashiers before cash-close implementation is released.
- Identify a dedicated hosted development project if external schema application is needed.
- Confirm actual speech/model/WhatsApp provider access with partner before marking those integrations ready.

## Checkpoint log

- 24 October 2026: migration branch verified remotely; documentation pack prepared. No new application tests, database execution, deployment or provider integration claimed by this entry.

Append each later checkpoint with selected stage, work done, tested revision, results, sync status and next action. Preserve unresolved failures and historical evidence.
