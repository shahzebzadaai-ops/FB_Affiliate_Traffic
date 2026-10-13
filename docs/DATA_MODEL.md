# Data model

PostgreSQL and Drizzle are the development system of record. `drizzle/0001_foundation.sql` creates users, sessions, login attempts, content items, task states, training, the campaign clock, audit events and Mandala goals, pillars and actions. `npm run db:setup` applies it and seeds the catalog. Do not put media binaries or secrets in these tables.

A market has a code, timezone, launch date, sprint length and vertical. The UK record uses Europe/London and 12 October 2026.

A Page has a stable code, persona, tone, visual system and pillars.

A person has an id, role, markets, Page assignments and an active flag.

A content record has permanent ID, source ID, country, Page, persona, pillar, angle, hook, priority, format, briefs, production instructions, assignee, reviewer, due time, publish time, approval status, asset requirements, publication status, checkpoints, CTA, week, monetisation flag, planned Drive path and unresolved notes.

Preview task state, stored only in the browser, adds checklist progress, quality checks, submission note, asset reference, Facebook URL, revision log, deadline overrides, cancellation reason and manual metrics. Organic and paid reach are separate nullable numbers.

Future tables should keep the same IDs so a Facebook post, a site session, an affiliate subID and a postback can point at `UK-BGUK-001`.

Backup plan for the next database milestone: daily logical backups, a tested restore, and no media binaries in Postgres. Drive file IDs are references. Phase 1 has nothing to back up beyond the git repository.
