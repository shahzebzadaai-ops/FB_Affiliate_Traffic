# Spec audit — 2026-10-14

Phase 0 only. This compares `AFFILIATE_TRAFFIC_OS_MASTER_SPEC.md` with the repository and the local database `affiliate_os` on `127.0.0.1`. Nothing in this pass was deployed, and no integration was connected.

The running app is `http://127.0.0.1:3000` on branch `cursor/phase-1-affiliate-os-0a9d`. Port `3004` is not open. `.env.local` has `DATABASE_URL` and `DATABASE_URL_TEST` only.

## Business decisions, not shipped features

These are founder decisions recorded in the spec. The software does not yet enforce them.

- 2030 target of $1,000,000 monthly affiliate revenue.
- Up to 30% of a Page’s collected approved organic revenue may be proposed as a test ad budget, only after owner approval.
- Starting operator salary maximum $50 USD per month. Compensation stays configurable. No other costs are approved.
- Future capacity of 500 operators, 5–10 Pages each. That is not a launch quota.
- Initial people named in the new spec: founder, Masu, later Hamza, Abdul Rehman, friends, trainees. The existing product notes use the name Masho for the publishing operator. No operator account exists. Do not create personal accounts until the founder confirms the names.
- Novita is the chosen AI provider. No key is configured.
- KVM2 is the intended host. It is not purchased in this environment. PlayerPulser at `187.53.130.227` stays out of scope (`docs/DEPLOYMENT_STRATEGY.md`).

## Verified in this database

One active `SUPER_ADMIN`. Zero `PUBLISHING_OPERATOR` rows. Zero invitations. Five `social_pages`. Zero `page_assignments`. 180 `content_items`, 76 with unresolved notes. 180 `task_states`. Campaign `uk-month-one` is `BUILD`, `started_at` null, timezone `Europe/London`. One Mandala goal, 8 pillars, 64 actions, all `NOT_STARTED`. Zero `production_jobs` and zero `media_workers`.

## Module matrix

| Module | Status | Evidence |
| --- | --- | --- |
| Local app and auth | Implemented | `src/app/page.tsx`, `src/app/api/auth/login/route.ts`, `src/server/accounts.ts`, `src/server/passwords.ts`. Scrypt passwords, hashed session cookie, lockout. One-time setup only while the user table is empty. |
| Owner and operator shells | Implemented | Owner routes under `src/app/owner/`. Operator routes under `src/app/staff/`. `src/components/app-shell.tsx`. Server layouts send non-owners away from `/owner`. |
| Page assignments and invitations | Partial | Tables and APIs exist: `page_assignments`, `invitations`, `src/app/api/assignments/route.ts`, `src/app/api/staff/invitations/route.ts`, `src/server/access.ts`. Isolation is tested in `tests/isolation.test.ts`. This database has no operator and no assignments. Join links are copied by hand. No email delivery. |
| Five UK Page candidates and 180-post plan | Partial | `src/domain/pages.ts`, `src/content/plan.generated.json`, `social_pages`. The spec treats the five brands as candidates, not verified live Pages. 76 unresolved plan notes remain. |
| Publishing operator desk | Partial | Today, Ready, Scheduled, Published, Issues, Calendar, My Pages, Training. `src/components/staff-queue.tsx`, `src/components/publish-desk.tsx`, `src/preview/queues.ts`. Ready requires an http(s) file URL. The desk does not post to Facebook. Download, thumbnail, and finished caption stay unavailable. While the campaign is not live, Today shows plan day 1 for every visible Page, not a personal locked week. |
| Campaign clock / START | Partial | `campaigns` status is only `BUILD` or `ACTIVE` (`src/domain/campaign.ts`). Default is BUILD. Start requires `manage_plan` and an explicit confirm (`src/server/work.ts`). There is no PAUSE. `confirmScheduled` and `recordPublication` in `src/server/task-commands.ts` do not check the campaign switch. They also do not call Meta. No ad-execution endpoint exists to refuse. |
| Approvals and audit | Partial | Task review states and `audit_events`. Owner approvals screen `src/app/owner/approvals/page.tsx`. Media approval writes one https URL and does not version the previous file (`src/server/media-worker.ts`). |
| Training | Partial | Static lessons in `src/domain/training.ts` and `training_progress`. Self-completion. Not a week-locked curriculum, quiz, or evidence review. |
| Mandala | Partial | Seeded goal and actions, all not started. `src/components/mandala-board.tsx`. It does not compute revenue. Editing and pause are not built. |
| Money Printer Turbo | Partial | PostgreSQL queue, Mac poll API, and FFmpeg assembler under `worker/`. Docs: `docs/MEDIA_WORKER.md`. No Novita call, no Kokoro install, no Drive upload, no rendered Page Reel. Job statuses are the worker queue, not the spec’s `idea -> brief -> generating -> QA` lifecycle. |
| Research and Page portfolio | Missing | No `research_reports`, sources, or `draft -> owner_approved -> assignable` research state. Growth Director states that it has no evidence (`src/components/growth-director.tsx`). |
| Operator week unlocks | Missing | No `operator_weeks`, week templates, `verified_complete`, or server-side lock that hides week N+1. An operator who finishes early can still see the whole assigned catalog through the calendar, not only the current week. |
| Page #6 creation assignment | Missing | Five catalog codes are fixed in `src/domain/types.ts`. No research-gated “create the next Page” task and no rule against invented addresses, because that flow does not exist. |
| Salary ledger | Missing | No salary table. `docs/FINANCE_AND_BUDGET.md` says no budget amount is approved. |
| Affiliate offers, clicks, postbacks | Missing | `src/server/finance.ts` returns `NOT_CONNECTED` and null figures for finance roles, 403 otherwise. `src/integrations/status.ts`. No offer or conversion tables. |
| Meta Ads and 30% reinvestment | Missing | No ad account, spend ledger, or budget calculator. Growth Director does not propose a dollar amount. |
| Meta publishing API | Missing | Operators open Meta Business Suite themselves. No Page token. |
| Departments as ten permission domains | Missing | Current roles are in `src/domain/types.ts` and `src/domain/permissions.ts`: `SUPER_ADMIN`, `ADMIN`, `CONTENT_MANAGER`, `CONTENT_OPERATOR`, `PUBLISHING_OPERATOR`, `DESIGNER`, `VIDEO_EDITOR`, `AFFILIATE_MANAGER`, `ANALYST`. There is no researcher, media buyer, trainee, or team lead role. Finance is separated from publishing operators. |
| KVM2 deployment | Missing | Local Next dev server and local Postgres only. `docs/DEPLOYMENT_STRATEGY.md`. |
| Canonical UI | Partial | `DESIGN.md` names Althoy as the single layout reference: `https://www.framer.com/marketplace/templates/althoy/` and `https://aithoy.framer.website/`. Earlier references were retired. A later request added the Milky Way navy canvas in `src/components/galaxy-backdrop.tsx` without changing the screen map. No further visual pass should start until the founder confirms that Althoy plus this canvas is still the one approved direction. |

## What is not broken

Login, the owner overview, the publishing Today queue, UK-SGIUK-001, the empty Ready queue, Mandala, and the launch dialog render on port 3000. The launch dialog can be closed without starting the clock. `npm test` last passed at 27 tests on this branch, including operator isolation and the media queue. Those tests use `affiliate_os_test`, not this development database.

Browser console still prints a Next.js development warning that a route segment could not be validated for instant navigation. The pages still render their content. That warning is not a failed module.

## Database changes not made

Do not add them until a phase is approved. The spec’s missing entities are `research_reports`, `sources`, `affiliate_offers`, `operator_weeks`, `week_templates`, `task_evidence`, `salary_records`, `reinvestment_approvals`, and `conversion_events`. A PAUSE status on `campaigns` would be a migration with a rollback, not a silent status rewrite.

## Sequence, after approval

1. KVM2 checklist only. Do not deploy until the server exists. Keep START default off.
2. Keep current auth and Page assignment. Add the campaign gate so schedule confirmation and URL recording also refuse while BUILD, still without posting to Facebook. Add PAUSE only if the founder wants a stop after start.
3. Operator weeks: server-side current-week visibility, evidence, and verified unlock. Hide later weeks from the API, not only the menu.
4. Research records and owner approval before any new Page assignment.
5. Novita configuration state, then one paid Reel only after a key and a spend limit exist.
6. Offer, click, and postback tables, then the 30% proposal that cannot spend by itself.
7. Salary configuration with the $50 maximum as data, not a hardcoded pay run.

## Founder approval still required

- Confirm Masho and Masu are the same person, or which name the first operator account should use.
- Confirm Althoy, with the current Milky Way canvas, remains the only visual reference.
- Kokoro install, licensed music, the 30–40 second proof against the PDF 20–35 seconds, and Drive OAuth (`docs/MEDIA_WORKER.md`).
- The 76 unresolved plan notes.
- Whether employment at a $50 monthly maximum is lawful for the people who will be invited. This app will not decide that.
- KVM2 purchase, Novita key, Meta app permissions, and affiliate program terms. Do not send those secrets in chat.
