# Build status

## Done

- Next.js, TypeScript, Tailwind CSS and shadcn/ui preview app.
- Five Page brand bibles and permission matrix.
- PDF import of 180 posts: 0 duplicates, 0 missing required fields, 76 posts with unresolved notes.
- Shahzeb company preview, Masho daily tasks, production workspace, checklists, calendar, approvals, training and empty finance / integration screens.
- Copyable external AI prompts. No AI API calls.
- Tests for import, UK clock change, permissions, submission evidence, self-approval and winner-sample refusal.

## Tested

- `npm test` — 11 tests passed.
- `npm run lint` and `npm run typecheck` passed.
- `npm run build` passed.
- Browser walkthrough on 12 October 2026: preview identities, Masho's day-1 tasks including UK-SGIUK-001, checklist toggle, 12 October calendar times, Shahzeb's five Pages, empty approvals, finance showing not connected, and a 390px Masho layout.

## Incomplete

- No Postgres, no ORM migrations, no real accounts.
- Preview task state lives in the browser only.
- Google Drive, Meta and affiliate networks are not connected.
- No public website, no live publishing, no performance history, no revenue.
- 76 content notes still need Shahzeb's decision.
- Training completion is not a real staff record.

## Risks

- Client-side preview routing can be bypassed. It is labelled as a preview and must not be treated as access control.
- The PDF brief text sometimes names a different asset from the format column. Producing the wrong one would waste Masho's day.
- Clock and "today" depend on the viewer's current London date. Before or after the sprint, the daily list changes.

## Pending decisions

- Approve or replace the PDF mix versus the 14/14/4/4 suggestion.
- Resolve the 76 content notes, especially format clashes, poll choices and carousel points.
- Confirm the public site name DateRoute UK.
- Choose the auth library and Postgres host for the next milestone.

## Next step

Real Postgres, real Shahzeb Super Admin authentication, real Masho login, staff management, server-side permissions, persistent task state, database-backed assignments and audit logging. Do not start that until Shahzeb reviews Phase 1.
