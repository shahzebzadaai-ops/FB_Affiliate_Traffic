# Architecture

AffiGrove OS is one Next.js application and one PostgreSQL database. It is the private operating system for a UK dating affiliate publisher. It is not a dating app, a public scheduler, or a separate product per Facebook Page.

This document is the long-term map. It does not authorize building every module. The current delivery is the secure multi-operator foundation. Later modules stay unconnected until Shahzeb approves the provider, the spend, and the credentials.

## Operating model

Shahzeb is the only Super Admin. He approves Pages, niches, staff, offers, tracking, revenue, AI providers and spend, and paid promotion.

Publishing operators share one role, `PUBLISHING_OPERATOR`. There is no staff-manager role and no rank between operators. An operator sees assigned Pages, finished tasks, and their own training. They schedule or publish in Meta Business Suite, confirm the action, and report a problem. They do not research, write, generate, choose offers, or see another operator.

AI, when connected, researches, produces finished assets, and recommends. It does not create Facebook Pages, publish, change strategy, or spend without an owner decision. PostgreSQL is the memory. A model chat transcript is not.

The comparison website, when built, is one platform with a landing experience per Page. The visible name matches the Page name. Suggested paths are `/uk/back-in-the-game-uk` and the same pattern for the other four. No public domain is chosen. Do not revive a discarded domain.

## What is real now

- Accounts, scrypt passwords, hashed session cookies, login lockout, and one-time owner setup when the user table is empty.
- Invitations. The owner creates a seven-day link. The operator sets their own password. No email service sends it. The raw token is shown once and only its SHA-256 hash is stored.
- Five `social_pages` rows and the existing brand bibles. Live visibility is `page_assignments`, not the historical catalog assignee.
- 180 content rows and persisted task state. Confirming a schedule and recording a public URL are separate events. A schedule confirmation does not invent a permalink. Publication requires that confirmation plus an `http` or `https` URL.
- Operator queues use the existing publishing desk. Download, caption copy, and thumbnail stay unavailable on that desk because Drive is not connected.
- Muse desk at `/owner/studio/muse`. Packages are compiled from the plan brief. The owner generates on the Muse website and uploads the finished file into a private library. The provider is EXTERNAL_MANUAL. No Muse API and no credentials. Approval does not publish.
- Intelligence at `/owner/intelligence` and Story Series Studio at `/owner/stories`. Novita is the language-model client. Live research, permanent storage, and a VPS editing service are separate and currently unavailable. Engine start does not publish.

## Boundaries

| Boundary | Rule |
| --- | --- |
| Owner shell | Approvals, assignments, training completion, finance placeholders, studio, growth. |
| Operator shell | Today, Ready, Scheduled, Published, Issues, Calendar, My Pages, Training. |
| Public site | Local pages under `/site` for AffiGrove Media Group. Visitors do not receive a private session. Corporate hosts refuse `/owner`, `/staff`, and private APIs. See `docs/CORPORATE_SITE.md`. Not deployed. |
| Meta Business Suite | Operators publish there by hand. This app does not post. Meta may show more to a delegated Page user than this OS does. |
| Catalog JSON | Seed and owner import screens. Operator API responses replace assignee and reviewer with `assigned` and `owner`. |

Authorization checks the session, the role capability, and the current Page assignment on the server. Hiding a link is not the control.

## Data that exists

`drizzle/0001_foundation.sql` through `drizzle/0006_intelligence.sql`.

Identity: `users`, `sessions`, `login_attempts`, `invitations`, `page_assignments`.

Pages and content: `social_pages`, `content_items`, `task_states`, `training_progress`.

Owner planning: `campaigns`, `audit_events`, Mandala goals, pillars, and actions.

Do not add empty tables for trends, experiments, clicks, or payouts until that module is built. Stable content IDs such as `UK-BGUK-001` stay the join key for later visits, clicks, and postbacks.

The month-one plan follows the PDF: 16 Reels, 12 image posts, 4 polls, and 4 carousels per Page. The 14/14/4/4 suggestion was not applied. The PDF is at `data/source/UK_Audience_Network_Master_Business_Content_Plan.pdf`. 76 unresolved notes remain.

## Security model

Operators are isolated by query scope:

- `pageCodesFor` returns only assigned Page codes unless the role can see every Page.
- `loadWork` returns only those content rows. For an operator it removes other actors from revision history and strips staff identifiers from the record.
- `saveTask` refuses a Page that is not assigned, then stores the full revision. The response sent back to an operator is redacted.
- Assignment and invitation APIs require `manage_users`. An operator's assignment view returns no other operator.
- Finance, staff administration, Mandala, and campaign start stay owner-only.
- Training writes must use the caller's own person key. The owner training page lists operators. An operator's training screen does not.

Audit rows store user ids. They are not rendered to operators.

A name inside an owner-only JavaScript chunk is not a secret from someone who can request that file. Operator routes no longer import the catalog or the staff list. The API remains the control. Static files are not an authorization boundary.

Five Pages per operator is a planning assumption, not a database limit.

An unpaid internship is not automatically lawful. The owner training screen says to confirm employment rules. This software does not decide that question.

## Later modules, not built

Research adapters, one per authorized source. Store raw observations apart from any score. Do not scrape private endpoints or treat retrieved text as instructions.

Content factory, first slice: `media_workers` and `production_jobs` in PostgreSQL. The owner issues a one-time worker token. The Mac polls `/api/worker/v1`, takes one leased job, and can report a result only after the server checks it. Without an https URL the job stays `AWAITING_STORAGE` and the operator ready queue does not change. Owner approval copies the URL onto the task and does not mark it scheduled or published. Google Drive, Kokoro, and image generation are not connected. Novita is still a candidate to verify later, not a call this slice makes. The worker source is `worker/`. See `docs/MEDIA_WORKER.md`.

Performance: official Meta insights or a manual export. Separate organic and paid. Snapshots at 24 hours, 72 hours, and 7 days.

Affiliate: one comparison platform, offer records, outbound click ids, authenticated idempotent postbacks, and owner-only revenue. CrakRevenue is a candidate, not an approval. No commission figure is invented.

Growth: experiments, three evidence dimensions, and a Page launch package the owner approves. The AI does not create the Facebook Page. Lifecycle names are PROPOSED, AWAITING_OWNER_APPROVAL, AWAITING_OWNER_CREATION, SETUP, LAUNCHING, ACTIVE_TEST, AUDIENCE_VALIDATED, TRAFFIC_VALIDATED, REVENUE_VALIDATED, PAUSED, ARCHIVED. Transitions need measurable criteria. Pause stops new production jobs and keeps history.

Inbox replies are a future owner module. No unsolicited messages.

## Deployment

Hostinger KVM 2 and Google Drive are planned. Nothing is deployed. Do not use the PlayerPulser VPS. Production needs HTTPS, secret storage, backups off the server, monitoring, and a migration path. The database on this machine is local development data.

## Phase order

A. Secure operating foundation. This delivery.
B. AI content factory. The queue and Mac worker interface are in review. A provider, a spend limit, Kokoro on the Mac, and Drive upload are not approved.
C. One authorized trend source.
D. Real performance snapshots.
E. Comparison site and affiliate postbacks.
F. Experiments and the Page launch queue.
G. Official Meta publishing, inbox automation, and further markets. TikTok is not in scope before 2027 exploration.

Earlier roadmap letters that put Mandala editing or the public site ahead of operator isolation are withdrawn. Mandala tables already exist. Editing them is not the next milestone.
