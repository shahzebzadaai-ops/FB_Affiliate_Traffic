# Roadmap

The current tested delivery is the secure multi-operator foundation. Later phases are not built. Complexity describes the subsystems involved, not a calendar estimate.

An earlier lettering put Mandala editing, a public site, and affiliate ingestion in a different order. This list replaces it. Mandala tables already exist from the first database migration. They are not the next build.

## A — Secure operating foundation

IMPLEMENTED. Persistent accounts, one-time Super Admin setup, `PUBLISHING_OPERATOR`, invitation links, Page assignments, five Page records, 180 content identities, task confirmation, and operator isolation tests.

Dependencies: a development Postgres. No Meta, Drive, Novita, affiliate, or domain credential.

Acceptance: `tests/foundation.test.ts` and `tests/isolation.test.ts`.

## B — AI content factory

Scope: a provider interface, the first verified Novita models if Shahzeb approves the spend, FFmpeg assembly, quality checks, Drive file ids, cost caps, and a rolling seven-day queue that can mark a task ready only when a real file URL exists.

Dependencies: an approved provider, a spend limit, and Google OAuth for the business Drive account. Do not share that password.

Complexity: job retries, asset versions, and staff-scoped file delivery.

Owner action: choose the provider, set the limit, and approve the first week of assets.

Acceptance: a task without a stored file cannot be downloaded. A regeneration flag does not call a model by itself. Operators still cannot see finance or each other.

## C — Trend discovery

Scope: one authorized research adapter, stored observations, and a Trend Radar that separates evidence from a model guess.

Dependencies: current access terms for that source. No private scraping.

Complexity: rate limits, cache, and failed-job recovery.

Owner action: approve the source and the query budget.

Acceptance: a trend without a source row cannot show a score.

## D — Real performance

Scope: manual or official Meta insights, website events, and 24-hour, 72-hour, and seven-day snapshots. Organic and paid stay separate.

Dependencies: a Meta app or an export Shahzeb provides. Not granted today.

Complexity: nullable metrics and delayed numbers.

Owner action: create the Meta app or supply the export.

Acceptance: missing metrics stay null. No token in the browser.

## E — Affiliate monetization

Scope: one comparison platform, a landing experience per Page, offer records, outbound clicks, signed postbacks, and owner-only approved PPS.

Dependencies: a domain decision and a real network contract. CrakRevenue is a candidate, not an approval.

Complexity: idempotent postbacks and a public site that cannot open the private OS.

Owner action: choose the domain and confirm the network.

Acceptance: no invented price, ranking, testimonial, or commission.

## F — Growth intelligence

Scope: experiments, trend plus audience plus commercial evidence, and a Page launch package. Shahzeb creates the Facebook Page and assigns the operator.

Dependencies: performance and affiliate facts from D and E, or an explicit insufficient-data state.

Complexity: sample size, pause rules, and capacity as measured workload rather than a fixed five-Page cap.

Owner action: approve or reject each proposal.

Acceptance: one Reel cannot create a Page. Failed tests stay on record.

## G — Official automation and expansion

Scope: Meta publishing when the Page permissions are approved, owner-managed inbox replies, more operators and Pages, and other markets. TikTok is an exploration target from January 2027, not a current build.

Dependencies: A through F, plus a separate approval for every new platform, country, and paid boost.

Acceptance: no unsolicited messages, no automatic spend, and no new property from an unapproved idea.
