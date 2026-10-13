# Build status

## Done

- Next.js, TypeScript, Tailwind CSS and shadcn/ui preview app.
- Five Page brand bibles and permission matrix.
- PDF import of 180 posts: 0 duplicates, 0 missing required fields, 76 posts with unresolved notes.
- Shahzeb company preview, Masho daily tasks, production workspace, checklists, calendar, approvals, training and empty finance / integration screens.
- Masho's screen is a publishing queue with Today, Ready, Scheduled, Published and Issues. Ready stays empty until a real file URL is stored. The task screen can open Meta Business Suite and can save a live URL. It does not post to Facebook. Flagging stores a note and does not call a model.
- Shahzeb's overview lists attention items and a five-Page table. Affiliate intelligence, Content Studio and Growth Director are owner screens. Unconnected money, reach and AI cost stay blank. See `DESIGN.md` and `docs/UI_ARCHITECTURE.md`.
- Copyable prompts remain on the owner brief only. No AI API calls.
- Tests for import, UK clock change, permissions, submission evidence, self-approval and winner-sample refusal.
- Milestone A: local PostgreSQL, Drizzle schema, one-time owner setup, staff invite, server sessions, persisted tasks, training, approvals, audit events and the Mandala tables. The 180 posts and 76 unresolved notes are seeded. Mandala actions start as NOT_STARTED.

## Tested

- `npm test` — 20 tests passed, including the database foundation tests.
- `npm run lint` and `npm run typecheck` passed.
- `npm run build` passed.
- Browser walkthrough on 12 October 2026: preview identities, Masho's day-1 tasks including UK-SGIUK-001, checklist toggle, 12 October calendar times, Shahzeb's five Pages, empty approvals, finance showing not connected, and a 390px Masho layout.
- Re-checked on 12 October 2026 after the preview-origin fix: `npm test` (11 passed), `npm run lint`, `npm run typecheck`, and `npm run build`.
- Opening the dev server as `127.0.0.1` used to leave a blank shell because Next.js blocked the dev WebSocket. `allowedDevOrigins` now includes `127.0.0.1`. `http://localhost:3000` and `http://127.0.0.1:3000` both hydrate the identity screen.
- The owner dashboard starts in build mode. "UK launch · Day N of 30" is no longer derived from today's date. The 30-day clock starts only after an explicit owner confirmation. The UTC timestamp is stored in the `campaigns` table.
- `npm run lint`, `npm run typecheck` and `npm run build` passed after Milestone A.
- 13 October 2026: `npm test` (20 passed), `npm run lint` and `npm run typecheck` after the publishing-desk correction. Masho's local session showed ready-to-publish at 0, an empty file slot, a Meta Business Suite instruction, a persisted regeneration flag, and a blocked finance route. The campaign stayed in build mode. The temporary page-operator login used for that check was removed.
- 13 October 2026: `npm test` (25 passed), `npm run lint`, `npm run typecheck` and `npm run build` after the role shells. Browser check covered the owner overview, affiliate intelligence, Content Studio, Growth Director, Masho's today queue, the empty ready list, and UK-SGIUK-001. A 390px capture showed Masho's bottom bar. The campaign stayed in build mode. Temporary review logins were removed.

## Incomplete

- Google Drive, Meta and affiliate networks are not connected.
- No public website, no live publishing, no performance history, no revenue.
- 76 content notes still need Shahzeb's decision.
- Pause and resume, the fuller START OPERATIONS checklist, and the rest of Mandala workflow editing are Milestone B.
- Password recovery email, invitations by email, and production hosting are not built.
- The content catalog is still compiled into the browser bundle. The server refuses unassigned task changes, but the briefs are not yet a secret from the client.

## Risks

- This Postgres instance is local to the development machine. It is not a hosted production database and it is not backed up off the machine.
- The PDF brief text sometimes names a different asset from the format column. The AI pipeline must not paper over those 76 notes.
- An older build treated Masho as the person who writes scripts and makes Reels. That is withdrawn. Do not put creative production back on his daily queue.
- Clock and "today" depend on the viewer's current London date. Before or after the sprint, the daily list changes.

## Pending decisions

- Approve or replace the PDF mix versus the 14/14/4/4 suggestion.
- Resolve the 76 content notes, especially format clashes, poll choices and carousel points.
- Confirm the public site name DateRoute UK.
- Choose the auth library and Postgres host for the next milestone.

## Next step

Do not connect a model, Drive or Meta in the next pass unless Shahzeb asks. The next product slice is Milestone B: Mandala evidence, the ideas inbox, and owner expenses, while keeping Masho on the publishing desk only.
