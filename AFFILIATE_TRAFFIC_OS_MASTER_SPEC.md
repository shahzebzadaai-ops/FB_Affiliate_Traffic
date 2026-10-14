# Affiliate Traffic OS — Master Product and Business Requirements
**Decision snapshot:** 2026-10-14  
**Purpose:** Stable source of truth for Cursor development, team onboarding, and future change control.  
**Status convention:** CONFIRMED = explicitly decided by founder; CURRENTLY KNOWN = asserted/observed in conversations but unverified in repository; PLANNED = not yet confirmed built; PROPOSED = design recommendation requiring owner review.

## 0. Instructions for the implementing developer / Cursor
1. **Audit before coding.** Inspect the actual repository, routes, database, current UI, job queues, APIs, environment configuration, test setup, README, and current running app. Produce a **DONE / PARTIAL / MISSING / BROKEN** inventory with actual file paths and evidence. No source-code audit has been performed by this handoff.
2. Do not mistake a discussion, account signup, UI mockup, or proposed architecture for a shipped feature. Never claim a module works until verified end to end.
3. **Preserve the existing application, data, integrations, and functioning workflows.** Make small reversible commits; include a migration and rollback plan for database changes. Do not arbitrarily replace the codebase.
4. **One visual reference only.** The founder previously selected a specific affiliate-network style website as the canonical UI reference and was dissatisfied with mixed inspirations. Recover the *exact* reference/link from existing project notes or ask for it if inaccessible. Do **not** invent a new visual direction or blend reference designs. First create a screenshot-by-screenshot gap list, then obtain approval for major UI changes.
5. Keep changes staged. **First show audit + implementation plan; then execute an approved phase.** For each completed phase provide files changed, migration steps, screenshots where applicable, automated/manual test results, and remaining blockers.
6. If an API key, KVM server, Meta authorization, affiliate offer feed, or required provider is missing, build an honest configuration/disabled-state UI; do not pretend a live integration exists.
7. A master owner-controlled **START / PAUSE** publishing switch is mandatory. Default must be **OFF** until the owner explicitly activates. Research, planning, draft creation, and QA can run while OFF, but no live publishing, scheduled posting, or paid budget changes should run. No publishing-day countdown should start before activation.

## 1. Business identity, economics, and growth model
- **CONFIRMED:** Business/platform name: **Affiliate Traffic OS**. An internal AI content production subsystem is called **Money Printer Turbo**. Recommend an independent **Operator OS** module within the same product.
- **CONFIRMED:** Initial target market is the United Kingdom, with a focus on Facebook 30+ audience/media brands, original story-driven Reels, editorial content, an owned comparison/guide site, and legitimate approved dating affiliate PPS/CPA offers. Other niches/geographies require research and explicit approval.
- **CONFIRMED:** Aspirational 2030 target is **$1,000,000 per month in affiliate revenue** (not guaranteed; track approved revenue vs net profit separately). Build the business backward from conversions and contribution margins, not follower counts.
- **CONFIRMED:** Organic-first discovery, then Meta Ads reinvestment into content **already proven to generate real, approved organic affiliate sales**. Proposed rule: up to **30% of each Page's approved and collected organic affiliate revenue** can be made available for that Page's *test advertising budget* after operating-cost/reserve checks and owner approval. Example: Page earns $100 organically => potential $30 ad budget; $70 remains before expenses. The percentage is a control, not a blind automatic spend. Track organic vs paid attribution and incremental paid profit separately.
- **CONFIRMED:** Founder has strong Meta Ads experience. Treat organic and paid distribution as coordinated but separately accountable business functions.
- **CONFIRMED:** Staff posting operations, advertising, legitimate identity/account-access administration, and growth/analytics must be functionally separate with least-privilege access.
- **CONFIRMED:** Potential future capacity is **500 operators**. Each could manage **5–10 legitimately authorized Facebook Pages**; theoretical staffing capacity should not be treated as live Pages or an automatic launch quota.
- **CONFIRMED:** **Starting operator salary up to $50 USD per month (maximum)**. This is the only founder-quoted base operator-cost figure. **Do not invent other costs.** Compensation can grow with work level and verified performance, subject to founder approval and applicable employment/wage law. Build salary and bonus configuration, not hardcoded assumptions. Starting base salary at max $50 implies $5–$10 salary per managed Page/month at 10–5 Pages, excluding unprovided costs.
- **CONFIRMED:** Initial team sequencing: founder + **Masu**; later **Hamza**, **Abdul Rehman**, friends, and potential trainees/interns. Build a safe training/sandbox mode and staff invitations/permissions; do not infer or assign specific personal accounts without authorization.
- **PLANNED:** 5,000-item content/creative intelligence library, with a `viral_potential` / `commercial_potential` scoring approach, source records, real observed outcomes, and versioned experiments. **Do not assert 5,000 validated records currently exist.**
- **RESEARCH-GATED:** Five candidate UK launch brands from the existing project plan: `Back in the Game UK`, `After Hours Singles UK`, `Single Parent Stories UK`, `Still Got It UK`, `Casual By Choice UK`. These are *candidates*, not five research-verified established Pages. Research current performance and eligible offers before confirming.
- **EXISTING PLAN BASELINE, not proof of publication:** First 30-day validation sprint: 5 pages, 36 posts per Page (16 Reels, 12 story/image posts, 4 polls, 4 carousels), total 180 assets / 80 original Reels. AI may adjust cadence per Page with evidence and owner approval; do not force this template on every future Page.

## 2. Known environment and integration status (do not overstate)
| Element | Current status known from conversation | What Cursor must verify |
|---|---|---|
| Local app | **CURRENTLY KNOWN:** An Affiliate Traffic OS app was opened at `127.0.0.1:3004`; founder reported earlier UI did not match chosen reference. | Repository, launch command, exact app routes, visual diff, working modules |
| Hosting | **PLANNED:** Founder intends to purchase and prepare a **KVM2 VPS**. | Whether purchased, OS/distro, access, capacity, firewall, HTTPS, backups |
| AI provider | **CONFIRMED CHOICE:** **Novita AI**; founder states account created. | API key *configured securely*? accessible model endpoints? funded credits? testing? |
| Money Printer Turbo | **PLANNED TARGET:** Holo.ai-like end-to-end video-production workflow. | Which code/jobs, if any, actually exist |
| Meta Page publishing / Meta Ads | **PLANNED / not verified:** Authorized integration or manual tasks. | App review, Graph API permissions, connected Page assets, ad-account authorization |
| Workflow + operator calendar | **DETAILED REQUIREMENT**; do not assume deployed. | Existing tasks, states, evidence, calendar, unlock checks |
| Master START / PAUSE | **REQUIRED**, requested previously; no implementation confirmed. | Presence, default OFF, server-side enforcement, logging |
| Mac mini | OPTIONAL local workstation, **not** a dependency for KVM2 or cloud generation. | Not needed for initial deployment |
| Future third-party tools | **FUTURE OPTIONAL**: Hootsuite, Buzzy or other authorized publishers/content tools. | Build adapter architecture; no subscriptions/active connections assumed |

## 3. Non-negotiable Page research and decisioning engine
Before Page creation or assignment, system must research and present evidence, not guess:
1. Actual current UK audience interests, Facebook Page/Reel trends, storytelling formats, original creative concepts, cartoon/animation formats where relevant, engagement signals, and competition.
2. Feasible approved affiliate offers: payout type, geo restrictions, age restrictions, brand safety, traffic-source requirements, link/landing-page terms, disclosure requirements, and approval status. Check source freshness and exact citations/URLs/timestamps. **Never fabricate offers, conversions, or product availability.**
3. Recommended Page niche, proposed name/handle (availability separately verified), target user persona, content pillars, winning hook hypotheses, creative treatment, recommended weekly posting cadence, monetization bridge, risks and confidence level.
4. Research recommendation moves through `draft -> researched -> reviewed -> owner_approved -> assignable`. Owner can reject, revise, or shelve.
5. Results must be updated as new organic performance and affiliate revenue arrive. Scores must explain their input signals and distinguish *predicted* virality from *observed* virality.
6. Use independent approved live research/data sources. A Novita AI account alone does **not** give reliable up-to-the-minute web/Meta/affiliate offer intelligence without appropriate connected tools.

## 4. Money Printer Turbo end-to-end production requirements
- Select approved Page + niche + topic + video duration; engine drafts UK-natural hook, full story, scenes, image prompts, video motion prompts, character/style consistency notes, voiceover script, captions, ending, hashtags and compliance checks.
- Support multiple creative styles **when appropriate** (cartoon animation, storytelling, illustrative, realistic), chosen from tests and research, not assumed winners.
- Generate still images, short AI video clips and narration using configured provider endpoints (Novita AI is chosen provider; verify model capabilities, formats, price, quotas and current terms before using).
- Assemble 9:16 Reels with captions, audio, transitions, permitted music/assets and brand rules; allow per-scene regeneration and final export, using suitable server-side rendering/encoding.
- Track generation attempts, estimated/actual credits/cost, job status, retries, provider errors, assets, versions and human approval.
- Content states: `idea -> brief -> generation_pending -> generating -> draft_ready -> QA -> approved -> scheduled -> published -> analytics_collected` plus `failed`, `rejected`, `paused`.
- Require originality: no recycled creator videos, fabricated dating testimonials, false customer stories, fake engagement, or copyright infringement. Human review required before live posting. Affiliate disclosures must be clear when required.
- **Do not start publishing** from automatic content generation; production and publishing are separate gates.

## 5. Operator OS: the principal newly finalized workflow
**Core principle:** Operators perform nearly all operational planning in Affiliate Traffic OS; they access Facebook only to execute actions not supported by authorized APIs. The OS supplies exact instructions and copy-ready fields/assets rather than expecting staff to research or invent them.

### 5.1 Identity, Page assignments and duties
- An operator account has individual authenticated login, role and permissions. Assign 5 starting Pages as capacity permits and raise toward 10 after competence/owner approval. All assignments are explicit and traceable.
- Daily calendar lists *only the current unlocked week's* tasks for assigned Pages, with due day, priority, exact steps, output fields, approved assets, links, example screenshots, and verification rules. Past completed tasks can be shown read-only as history; do not expose future assignment content.
- Duties expand incrementally: Page setup -> routine publishing/engagement -> extra Page creation -> growth tasks -> mentorship/QA -> leadership. Unlocking increased duties must not automatically grant financial permissions or access to unrelated assets.
- Examples of daily tasks: open assigned Page, publish approved content, upload FB post URL/ID, respond to eligible comments using guidelines, quality checks, mark status, provide proof. No pressure to generate fake likes/shares/comments.

### 5.2 Locked weekly curriculum and tasks
- Each operator has a week number aligned to their own verified onboarding/activation date, not today's global calendar or the founder's publishing START date.
- **Unlock week N+1 only when BOTH** (a) the scheduled week N period has elapsed, AND (b) all *required* week N tasks are `verified_complete` (not merely self-checked), including necessary manager approvals. If incomplete, future weeks remain hidden/locked until resolved. Optional tasks cannot block unless configured.
- Need states `locked`, `available`, `in_progress`, `submitted`, `needs_changes`, `verified_complete`, `blocked`, `waived` (manager-waived with reason and audit). Show progress and exact blockers without leaking future tasks.
- Owner/supervisor can grant a narrowly-scoped override with reason; record timestamp, actor and impacted week. Prevent accidental early access through front-end-only restrictions; enforce on server.
- Current week's work can include training videos/lessons/quizzes and staged new duties. Staff only see approved current work and cannot create unauthorized jobs.

### 5.3 Page creation / expansion assignment
- Once an operator successfully handles their first five Pages, the following eligible week may assign **`Create Page #6`** (later one at a time as approved), if research and ownership approvals pass.
- OS gives exact approved Page name, category, handle/username candidate, bio/description, brand profile image, cover image, verified company URL, location/contact fields when appropriate, first-week content pack, step-by-step setup, and required proof.
- Operator manually creates/sets up the Page using a real, properly authorized Meta account/Page access; returns Page URL, screenshots, finalized handle/ID, and checkable evidence. Reviewer verifies, then Page becomes active/assignable.
- Address API may only return **genuine verified business/location data with legal authority to publish**. Many content/community Pages should have no street address; never invent locations or use random real addresses, fabricated businesses, misleading local presences, or fake identities.
- Legitimate 'warm-up' = finish authentic setup, gradually publish original content, engage with real users, monitor Page health and comply with Meta policies; **no fake engagement, account farms, deceptive identities or policy circumvention**.

### 5.4 Operator performance, compensation and internships
- Operator scorecard: eligible task completion, verification rate, timeliness, originality/QA rework, policy warnings, attributable Page performance, verified sales and process quality. Avoid over-relying on views or penalizing operators for uncontrollable factors.
- Salary ledger tracks founder-approved base (starting maximum $50/month), approved raises, bonuses, currency, payment periods and audit history. No automatic wage reductions/raises without owner approval; observe applicable wage, worker classification and internship rules.
- Training/sandbox for Masu and initial cohort, then Hamza, Abdul Rehman, friends and interns; separate trainee permissions and gradual promotion. No shared personal logins or buying fake accounts.

## 6. Paid growth loop and revenue truth
- Track unique Page, Reel/post, content variant, Page operator, content source, website sessions, affiliate outbound clicks/subIDs, tracked conversions, approved conversions, rejected conversions, **actually collected revenue**, and refund adjustments.
- Each Page has `organic_revenue_approved_collected`, `ad_spend_authorized`, `ad_spend_actual`, `attributed_paid_revenue`, `creative_costs`, and (when costs supplied) `contribution_margin`.
- Suggested `eligible_ad_test_budget = min(0.30 * collected_approved_organic_revenue, available_cash_after_reserves, founder_defined_cap)` subject to explicit owner approval and approved offer/platform ad rules.
- Prioritize content proven on both meaningful engagement and **actual organic affiliate sales**. Ad execution should be set up to optimize legitimate downstream purchase/lead objectives where measurement allows; do not treat a boost's engagement lift as confirmed incremental profit.
- Separate advertisers/media buyers from staff posting. Record experiments, campaign approvals, cost per approved sale, marginal lift, spend caps and kill-switches.
- Financial dashboard reports gross tracked, approved, collected and net contribution separately. Never count unapproved leads as earned commissions.

## 7. Proposed modules and user experience
A. `Executive Command`: overview, revenue funnel, spend, per-Page performance, approvals, START/PAUSE kill switch, access/audit, blockers.
B. `Research & Page Portfolio`: trend/offer research, Page candidates, approvals, launched Page inventory, audience positioning, Page health.
C. `Money Printer Turbo`: idea library, script/scene builder, provider job queue, assets, previews, QA, export.
D. `Operator OS`: staff onboarding, assignments, **current-week-only** calendar, task detail cards, progression, evidence and QA, pay ledger.
E. `Growth & Meta Ads`: verified organic winners, proposed 30% budget, paid testing, approvals and analytics.
F. `Affiliate & Comparison Hub`: offer directory, approval status, eligibility, approved links, comparison content, disclosures, affiliate postbacks and click attribution.
G. `Integrations & Infrastructure`: server config, Novita setup, Meta authorized connections, website analytics, future third-party adapters, health monitor.

Suggested roles: `owner`, `admin`, `researcher`, `creative_producer`, `reviewer`, `operator`, `team_lead`, `media_buyer`, `finance`, `affiliate_manager`, `trainee` with fine-grained capabilities and audited permission changes.

**UI:** Founder requires exact adherence to one previously supplied affiliate-network UI reference. Do not mix unrelated dashboard aesthetics or give a generic redesign. Match navigation hierarchy, proportions, typography, spacing, states and responsive behavior to the approved single source, while integrating the modules above. Do not infer the missing link.

## 8. Technical and information architecture considerations (PROPOSED, audit first)
- Logical entities: `users`, `roles`, `permissions`, `teams`, `operator_assignments`, `pages`, `page_candidates`, `research_reports`, `sources`, `affiliate_offers`, `offer_eligibilities`, `content_ideas`, `creative_variants`, `content_assets`, `production_jobs`, `week_templates`, `operator_weeks`, `tasks`, `task_evidence`, `task_reviews`, `competencies`, `salary_records`, `performance_snapshots`, `meta_campaigns`, `reinvestment_approvals`, `conversion_events`, `revenue_ledger`, `settings`, `audit_log`.
- Owner START/PAUSE enforced by shared server-side service/queue checks, not only a button. Global OFF must stop pending publish/paid operations, while permitting drafts and analytics; recorded activation and pause times.
- Every operator-visible task has allowed role, ownership check, Page relation, unlock predicate, verified evidence and state machine. Idempotent APIs, race-condition safeguards and audit logs required.
- Separate secrets/API credentials server-side with least privilege; never expose Novita keys, Meta tokens or affiliate credentials to operators or browser bundles.
- For KVM2: confirm server plan first; configure HTTPS, database, background workers, object storage/backup for generated MP4/assets, process supervisor, monitoring, disk limits, secrets and disaster recovery. Prefer portable deployment and queue-based video jobs; memory/CPU-intensive video rendering must not block web requests.
- Calendar local-time distinction: Page audience timezone generally UK (Europe/London, DST-aware); staff may work in other timezones. Store UTC and display both as needed.
- Future API adapters (Hootsuite, Buzzy or similar) are optional; check vendor support, cost and terms before enabling. No fake connections or placeholders implying active capability.

## 9. Implementation priority and gates
**Phase 0 — Inspect and document (do first):** identify actual codebase, active localhost app, current UI, broken/incomplete features, database schema and deployments; list missing information; produce prioritized gap report. Recover canonical UI reference or ask founder for link before major UI work.

**Phase 1 — KVM2 readiness:** deployment checklist, secure server/base app deployment only when VPS exists; authentication/RBAC, backups, START=OFF, health checks. Local development remains usable until VPS is ready.

**Phase 2 — Core product foundations:** Page/offer records, owner approval engine, audit logs, operator onboarding and task/calendar schema, company-owned Page inventory.

**Phase 3 — Research + Novita:** UK research reports with sources; approved Page candidates; securely configure/test Novita model APIs; generate one complete Reel in Money Printer Turbo with end-to-end QA/cost tracing.

**Phase 4 — Operator OS pilot:** founder + Masu; five-page capacity as assigned; true current-week-only calendar, evidence verification, delayed next-week unlock; Page #6 setup assignment; later onboard Hamza, Abdul Rehman, friends and interns.

**Phase 5 — Attribution + paid reinvestment:** comparison offer rules, affiliate click IDs and conversion postbacks, paid/organic revenue distinction, 30% reinvestment approval workflows and Meta Ads authorized connections.

**Phase 6 — Scale:** 500-operator performance infrastructure, leader dashboards, training certification, provider adapters, improved automation after demonstrable reliability and economics.

## 10. Acceptance tests for initial implementation
1. Anonymous/ordinary operators cannot view future weekly task descriptions or another operator's Pages/tasks even by direct URL/API.
2. Operator completing Week 1 on day 2 does **not** open Week 2; week end plus all required verified tasks must hold. Week 2 remains locked if any required task is pending/failed; manager override requires reason and audit.
3. A Page #6 assignment cannot appear until owner-approved candidate research exists and an operator is eligible; operator gets exact fields and genuine location info or **no address**.
4. With START=OFF, any publish/ad execution endpoint and background worker refuses execution, but allows planning, generation and QA.
5. Page organic approved/collected revenue $100 yields **proposed** ad cap $30 (not actual committed spend); pending/unapproved commissions do not generate a spendable budget.
6. Operator base salary defaults are not fabricated; setting starting max $50 is configurable with owner control and staged raises.
7. Novita missing-key state shows truthful configuration message; no phantom generation. With a valid key the provider smoke test and one complete Reel succeed or report actionable errors and costs.
8. A staff-created Page requires manual submission + reviewer approval before counted as managed live Page.
9. Visual changes use the exact founder-approved **single** reference and verified screenshots, not multiple unrelated inspiration sites.
10. Produce a working pilot demonstration, not just Figma/mockups: owner approves candidate, assigns Pages, operator sees current week, completes verifiable tasks, reviewer approves, and owner views audit trail.

## 11. Open inputs to request only when needed
- Exact canonical affiliate-network design reference URL/screenshots (must not guess).
- Actual repo root and application startup command if Cursor is not already in the correct project.
- KVM2 order/provider/credentials once purchased; do not ask for passwords in chat.
- Secure Novita API credentials and selected actual models only inside secrets manager/environment variables.
- Official/authorized Meta Page, ad-account and partner postback permissions plus company-owned comparison domain when ready.
- Actual affiliate programs/payout/terms, allowed traffic sources, and trustworthy research-data feeds.
- Exact staff contracts/local wage requirements, payment system and raise/bonus rules (founder gives numbers later).

## 12. Definition of done / change control
For every feature use: requirement ID, owner decision/status, design reference, implementation files, DB migrations, tests, screenshots, deployed/staged status, dependency, cost implication and next action. Mark unbuilt work `planned`, partially working work `partial`, live verified work `implemented`. Revisit the master spec whenever the founder makes a new decision. **Do not say the implementation is complete solely because a prompt was sent to Cursor.**
