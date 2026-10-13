# Decision log

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

Development preview identities only. Real Shahzeb and Masho logins are the next milestone, with server-side permissions.

## Persistence

Validated JSON catalog in git for Phase 1. Browser-local preview state for checklists and approvals. Postgres is next, not now.

## Campaign clock

The 180-post rhythm stays anchored to Monday 12 October 2026 as a plan template. That date is not a live launch. The campaign stays in build mode until Shahzeb confirms Start 30-day launch. The UTC start timestamp is stored in `data/local/campaign-launch.json`, which is not committed. UK calendar days use Europe/London. A planned time never marks a post published.
