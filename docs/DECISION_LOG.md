# Decision log

## 2026-10-13 — AI-first operating model

PERMANENT. Masho is the Facebook Page operations employee, not the creative producer. The AI pipeline prepares research, hooks, stories, captions, images, scripts, voiceover, subtitles and finished files on a rolling seven-day queue. Shahzeb alone approves strategy, offers, tracking, postbacks, revenue, roles, AI spend, and new Pages or countries. Fictional stories are not testimonials. No model is connected yet, and no screen may pretend that it is. Facebook scheduling stays manual in Meta Business Suite until an approved API works. Do not revert Masho to writing prompts.

## 2026-10-12 — Phase 1 scope

Build the preview operating system. Do not build live Drive, Meta, affiliate postbacks, production login or the public website. Stop after Phase 1 for Shahzeb's review.

## Product name

The PDF calls the future system AudienceOS. This approved brief names it Affiliate Traffic OS. The product name is Affiliate Traffic OS.

## Revenue wording

The original README said CPA / PPS. The approved brief prefers deals that pay for a qualifying customer or sale. PPS is the rule. CPA language from the PDF is kept only where it means that same qualifying paid action.

## Content mix

The build brief suggested 14 Reels, 14 text/image posts, 4 polls and 4 carousels per Page. The PDF specifies 16 Reels, 12 image/story posts, 4 polls and 4 carousels, and its 180 rows follow that rhythm. The specific instruction was to preserve 180 until Shahzeb approves a reallocation. The imported plan follows the PDF.

## Drive folders

The PDF path was `/AudienceOS/01_UK/Pages/[PAGE]/YYYY-MM/[POST-ID]/`. The approved brief uses `Affiliate Traffic OS/UK/{Page name}/{YYYY-MM}/{content ID}/` with Brief, Scripts, Images, Audio, Working-Videos, Final-Videos, Thumbnails and Captions. The approved brief wins.

## IDs and launch

Permanent content ID: `UK-` plus the PDF row ID. Launch Monday 12 October 2026, Europe/London, 30-day sprint. Still Got It UK's first Reel stays at 19:00 UK. Other Pages are staggered by a few minutes.

## Format conflicts inside the PDF

Where a row's format column and its specific brief sentence disagree, the format column wins until Shahzeb resolves the note. Poll choices and carousel points that were not written in the PDF are unresolved, not invented.

## Authentication

APPROVED: Shahzeb is Super Admin. Masho is Content Operator. Nobody approves their own work. There is no public registration.

IMPLEMENTED: one-time owner setup, scrypt password hashes, HTTP-only session cookies, server checks on owner routes and APIs, staff invite, and disabling an account revokes its sessions. A third-party auth product was not added. Next 16 and a two-person company did not need one yet.

OPEN: email invitations, password recovery mail, and production HTTPS cookie settings.

## Persistence

IMPLEMENTED: PostgreSQL is the development system of record for users, sessions, the 180 content rows, task state, training, the UK campaign clock, audit events and the Mandala. The imported JSON catalog remains the source that `npm run db:setup` seeds from. Drizzle ORM maps the tables. Media binaries stay out of the database.

The database in Cursor Cloud is local and development-only. It is not production hosting.

## Campaign clock

The 180-post rhythm stays anchored to Monday 12 October 2026 as a plan template. That date is not a live launch. The campaign stays in build mode until Shahzeb confirms Start 30-day launch. The UTC timestamp is the `campaigns` row `uk-month-one`. UK calendar days use Europe/London. A planned time never marks a post published. Pause, resume and the longer readiness checklist are not implemented yet.
