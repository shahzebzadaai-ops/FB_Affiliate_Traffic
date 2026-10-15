# Build status

## Done

- Next.js, TypeScript, Tailwind CSS and shadcn/ui preview app.
- Five Page brand bibles and permission matrix.
- PDF import of 180 posts: 0 duplicates, 0 missing required fields, 76 posts with unresolved notes.
- Shahzeb company preview, Masho daily tasks, production workspace, checklists, calendar, approvals, training and empty finance / integration screens.
- Masho's screen is a publishing queue with Today, Ready, Scheduled, Published and Issues. Ready stays empty until a real file URL is stored. The task screen can open Meta Business Suite and can save a live URL. It does not post to Facebook. Flagging stores a note and does not call a model.
- Shahzeb's overview lists attention items and a five-Page table. Affiliate intelligence, Content Studio and Growth Director are owner screens. Unconnected money, reach and AI cost stay blank. See `DESIGN.md` and `docs/UI_ARCHITECTURE.md`.
- Copyable prompts remain on the owner brief. Prepare for Muse AI compiles a package from the plan brief and stores a file the owner uploads. No Muse API is called.
- Tests for import, UK clock change, permissions, submission evidence, self-approval and winner-sample refusal.
- Secure multi-operator foundation: `PUBLISHING_OPERATOR`, invitation links, `social_pages`, `page_assignments`, schedule confirmation separate from publication, and server-side isolation. Operator payloads omit other operators and the historical catalog assignee. See `docs/ARCHITECTURE.md`.
- Media queue: owner-issued worker credentials, durable production jobs, leases, heartbeats, and approval that copies an https URL onto a task without scheduling it. The Mac worker source and install guide are in `worker/` and `docs/MEDIA_WORKER.md`. No Reel has been rendered.
- Muse desk: Prepare for Muse AI compiles a package from the plan brief, stores an uploaded file, and records a typed token balance. It does not call Muse and it does not publish.
- Intelligence desk and Story Series Studio. Novita is called only when a key and model id are set and the intelligence engine is started. Live research, permanent storage, and the VPS editing service are reported as unavailable. A contract test can store a pilot. That test is not a live Novita call.
- Research to Muse, for Back in the Game UK only. The owner saves https sources and notes, then the configured language model ranks topics and writes one 20–35 second Muse package after approval. Publishing stays disabled. The package is stored on `research_packages` and is not inserted into the 180-post plan. Migration `0007_research_packages.sql` is additive and is not applied to production by this change.

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
- 13 October 2026: `npm test` (26 passed), `npm run lint`, `npm run typecheck` and `npm run build` after operator isolation. Three operator identities are covered in `tests/isolation.test.ts`.
- 14 October 2026: `npm test` (33 passed), `npm run lint`, `npm run typecheck` and `npm run build` after the local AffiGrove site. The public pages render at `/site`. A contact message required consent, was stored, appeared in the owner inbox, and the review row was removed. Unauthenticated finance and enquiry reads returned 401. A cross-origin form post returned 403. The campaign stayed in build mode. The sign-in screen stayed the private OS.
- 14 October 2026: `npm test` (27 passed), `npm run lint`, `npm run typecheck` and `npm run build` after the media queue. Python `unittest` for the assembler passed. A Linux FFmpeg technical check produced a 1080×1920 H.264 file in 0.738 seconds, peak child RSS about 373 MiB, temporary files about 59 KiB, and no external API call. It is not a Page asset and not a Mac measurement. The Systems screen queued UK-SGIUK-001 with no file, and the owner overview showed the ready buffer at 0 of 20. The campaign stayed in build mode. The demo job and session were removed.
- 14 October 2026: `npm test` (38 passed), `npm run lint` and `npm run typecheck` after the Muse desk. A production-mode walk of UK-BGUK-001 prepared three reel concepts and six image prompts, uploaded one image, approved it, and recorded a typed token balance. No model was called. The campaign stayed in build mode and the post stayed unpublished. All eight Muse capabilities stayed untested.
- 14 October 2026: `npm test` (43 passed), `npm run lint` and `npm run typecheck` after the intelligence desk. A contract test stored a five-episode pilot against a local mock and did not call Novita. Python assembler tests joined two clips into a 1080×1920 file. Live research stayed unavailable. The campaign stayed in build mode.

## Incomplete

- Google Drive is the named initial 5 TB library. OAuth is not connected, and no deletion job runs. The retention plan is `docs/MEDIA_RETENTION.md`. Novita, Kokoro, Meta and affiliate networks are not connected. Downloads stay unavailable. No file link is faked. The Still Got It proof has not been generated on the Mac. A Linux FFmpeg check, when recorded, is not that Reel and not a throughput number.
- launchd is a template only. It is not installed.
- The public site is live at affigrove.io and the private OS is live at os.affigrove.io. Search indexing stays off. Company number, office, public email, phone, and governing law are still awaiting approval. See `docs/CORPORATE_SITE.md`.
- No live publishing, no performance history, no revenue.
- 76 content notes still need Shahzeb's decision.
- Invitation email delivery and password recovery mail are not built. The owner copies the join link.
- Owner-only JavaScript still contains the historical assignee id because the import screen reads the plan file. Operator routes do not.
- Pause, resume, and Mandala editing are not the next milestone. The tables exist and stay not started.
- The Hostinger release path is in use. Copies of the database off that machine, and monitoring beyond the release health check, are still open. This retention decision does not deploy and does not delete files.

## Risks

- This Postgres instance is local to the development machine. It is not a hosted production database and it is not backed up off the machine.
- The PDF brief text sometimes names a different asset from the format column. The AI pipeline must not paper over those 76 notes.
- An older build treated operators as the people who write scripts and make Reels. That is withdrawn.
- Clock and "today" depend on the viewer's current London date. Before or after the sprint, the daily list changes.
- Meta Business Suite can show Page members that this application hides.

## Pending decisions

- The PDF mix is in the product. The 14/14/4/4 suggestion was not applied. Shahzeb can still change it later.
- Resolve the 76 content notes, especially format clashes, poll choices and carousel points.
- Choose a public domain. Do not assume a previous name.
- Confirm employment rules before any unpaid training period.
- Approve a provider and a spend limit before any AI call.
- Approve Kokoro on the Mac, the 30–40 second proof against the PDF's 20–35 seconds, a licensed-music choice, and Drive OAuth before any Reel is treated as a calendar asset.

## Next step

Do not connect a model, Drive or Meta unless Shahzeb asks. Do not install the worker on the Mac from this cloud session. The owner checkpoint is `docs/MEDIA_WORKER.md`.
