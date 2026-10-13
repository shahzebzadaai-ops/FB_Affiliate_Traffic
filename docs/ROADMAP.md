# Roadmap

Milestone A is the current tested foundation. The preview shell follows `DESIGN.md`. Later milestones are not built. Complexity describes the subsystems involved, not a calendar estimate.

## A — Secure foundation

IMPLEMENTED. Local PostgreSQL, owner bootstrap, Masho login, server permissions, persisted tasks, checklists, approvals, training and audit rows. Mandala tables are seeded as not started.

Dependencies: a development Postgres. No Meta, Drive or AI credential.

Acceptance: the tests in `tests/foundation.test.ts`.

## B — Mandala command centre

Scope: edit action status only with evidence, dependencies, weekly review, founder ideas inbox, expense and budget entry, and the fuller START OPERATIONS control with readiness, pause and resume.

Dependencies: Milestone A. No paid API.

Complexity: the owner command centre, Mandala editing and finance entry screens, plus campaign pause rules that must not move already published posts.

Owner action: enter real expenses and confirm any launch. No budget is pre-approved.

Can be done without paid integrations: yes.

Acceptance: an action cannot become successful from a checkbox alone. Pause does not change the original start timestamp. Finance still shows no invented revenue.

## C — Seven-day AI production and Drive

Scope: a rolling seven-day pipeline that writes finished files into Drive. Masho only receives tasks that have a real file, caption and thumbnail. Shahzeb approves the pipeline, the spend limit and any new angle or Page. No mock generator may be labelled as working AI.

Dependencies: an approved model provider, a spend limit set by Shahzeb, and Google OAuth for `affiliateshahzeb@gmail.com`. Do not share that password. Confirm storage before claiming 5 TB.

Complexity: provider adapters, file versions, a seven-day queue, regeneration requests, and staff-scoped Drive access. The 76 unresolved briefs still need Shahzeb.

Owner action: choose the provider, set the spend limit, authorize Drive, and approve the first week of assets.

Without paid integrations: the publishing desk and the empty states. Not the files.

Acceptance: a task without a stored file cannot show a download. A regeneration flag does not call a model by itself. Masho still cannot see finance.

## D — Meta connector

Scope: one Page first, then five. Official Graph API only. Metric registry for 2026 metric changes. Manual export fallback. No scraping. Do not claim scheduling is automated until this access works. Until then, Masho uses Meta Business Suite.

Dependencies: a Meta app, Page tokens, current permission review. Not granted today.

Complexity: token storage, sync jobs, nullable metrics, organic versus paid.

Owner action: create the Meta app and approve permissions.

Without paid integrations: the registry and manual import can be designed first. Live Insights need the app.

Acceptance: missing permissions and deprecated metrics stay null. No token in the browser or logs.

## E — AI Growth Director

Scope: rules-based classification first, then proposals for new angles, personas and Pages from sanitized Facebook and affiliate evidence. Shahzeb approves before a significant change. Approved creative work returns to the seven-day pipeline, not to Masho as an author. No automatic publish and no automatic spend.

Dependencies: real metrics from D, or an explicit insufficient-data state. A model key is optional.

Complexity: evidence packets, model version logging, and the approval-to-task handoff.

Owner action: approve or reject each idea.

Without paid integrations: the rules fallback and the insufficient-sample behaviour.

Acceptance: the model cannot invent a Meta metric. Small samples stay insufficient.

## F — Publisher MVP

Scope: one public site, five editorial sections, disclosure and privacy, stable page IDs. Not 100 sites.

Dependencies: a domain and hosting decision. None is authorized now. Do not use the PlayerPulser VPS.

Complexity: a publisher module isolated from the private OS.

Owner action: choose the domain and approve the first pages.

Without paid integrations: drafts can be built locally. Publishing needs the hosting decision.

Acceptance: private admin routes are not public. Affiliate links are disclosed. No thin duplicated sites.

## G — Affiliate commercial engine

Scope: offers, click IDs, subIDs, signed postbacks, pending versus approved versus reversed versus paid.

Dependencies: a real network contract and postback documentation.

Complexity: idempotent ingestion and owner-only reporting.

Owner action: confirm the network, GEO and payout terms.

Without paid integrations: the data model and a rejected unsigned postback test.

Acceptance: categories are never merged. No invented commission.

## H — Multi-property expansion

Scope: more domains, Pages, staff, GEOs and paid amplification after evidence.

Dependencies: A through G, plus owner approval for every new country, Page and site.

Complexity: shared templates without copying a new app per site.

Owner action: approve each expansion.

Without paid integrations: no. Paid media and extra properties wait for evidence.

Acceptance: a new property cannot launch from an unapproved idea.
