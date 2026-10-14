<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Affiliate Traffic OS

Before a major change, read `docs/PRODUCT_MASTER.md`, `docs/ARCHITECTURE.md`, `docs/DECISION_LOG.md`, `docs/BUILD_STATUS.md`, `docs/ROADMAP.md` and `DESIGN.md`.

The product is a private operating system. Do not turn it into a marketing landing page, and do not copy Framer templates or add Framer as a dependency. Shahzeb's shell is the owner control centre. The operator shell is the publishing desk. Unconnected reach, clicks, commission and AI cost stay blank. Do not draw a fake Reel and call it finished.

This is an internal operating system for an organic-first UK dating affiliate publisher. It is not a dating app, not a generic post generator, and not a public Facebook scheduler.

Publishing operators publish finished assets. They do not write prompts, scripts, images or Reels. They cannot see each other. Do not hardcode a person's name into an authorization check. Do not label a mock file as AI output.

The secure multi-operator foundation is in place: local PostgreSQL, owner setup, invitation links, Page assignments, and server-side isolation. A media queue and Mac worker interface are in review. Google Drive, Meta, Novita, Kokoro, and affiliate networks are not connected. Do not invent commissions, followers, engagement, render time, or a finished Reel. The database on this machine is development-only. Do not treat it as production hosting.

Do not merge or deploy this branch without Shahzeb's approval. Do not install launchd, buy hardware, or start batch production from a cloud session. The Mac proof is a local session. Read `docs/MEDIA_WORKER.md` before changing the worker.

Update `docs/BUILD_STATUS.md` when a milestone changes what is done, tested, incomplete, risky, or next.

Commands:

- `npm run dev` starts the app
- `npm run db:setup` migrates and seeds the local development database
- `npm run import:plan` rebuilds `src/content/plan.generated.json` from the PDF text extract
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`

Do not deploy to Hostinger or any public host from this repository unless Shahzeb asks.
