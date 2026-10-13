# Roadmap

Milestone A is the current tested foundation. Later milestones are not built. Complexity describes the subsystems involved, not a calendar estimate.

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

## C — Content production

Scope: Drive connection, asset versions, brief resolution queue, copyable prompts kept, approval evidence stored as files.

Dependencies: Google OAuth for `affiliateshahzeb@gmail.com`. Do not share that password. Confirm storage before claiming 5 TB.

Complexity: OAuth, folder IDs, staff-scoped access, and the 76 unresolved briefs.

Owner action: authorize Drive and resolve brief conflicts.

Without paid integrations: the brief queue and prompts can be finished before Drive OAuth.

Acceptance: a disconnected Drive screen stays labelled disconnected. Unresolved PDF notes stay visible until approved.

## D — Meta connector

Scope: one Page first, then five. Official Graph API only. Metric registry for 2026 metric changes. Manual export fallback. No scraping.

Dependencies: a Meta app, Page tokens, current permission review. Not granted today.

Complexity: token storage, sync jobs, nullable metrics, organic versus paid.

Owner action: create the Meta app and approve permissions.

Without paid integrations: the registry and manual import can be designed first. Live Insights need the app.

Acceptance: missing permissions and deprecated metrics stay null. No token in the browser or logs.

## E — AI learning

Scope: rules-based classification first, then three creative hypotheses from sanitized evidence, owner approval, and a task for Masho. No automatic publish.

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
