<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Affiliate Traffic OS

Before a major change, read `docs/PRODUCT_MASTER.md`, `docs/DECISION_LOG.md` and `docs/BUILD_STATUS.md`.

This is an internal operating system for an organic-first UK dating affiliate publisher. It is not a dating app, not a generic post generator, and not a public Facebook scheduler.

Phase 1 is a development preview. It has no production authentication, no live Google Drive, no live Meta connection and no affiliate revenue. Do not invent commissions, followers or engagement.

Update `docs/BUILD_STATUS.md` when a milestone changes what is done, tested, incomplete, risky, or next.

Commands:

- `npm run dev` starts the preview
- `npm run import:plan` rebuilds `src/content/plan.generated.json` from the PDF text extract
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`

Do not deploy to Hostinger or any public host from this repository unless Shahzeb asks.
