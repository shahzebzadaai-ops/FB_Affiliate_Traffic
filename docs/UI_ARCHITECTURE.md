# UI architecture

The preview is a private operating system with two shells. Visual rules live in the root `DESIGN.md`. This file is the map of screens and components.

## Shell

`src/components/app-shell.tsx` chooses the sidebar from the area.

- Owner links: Overview, Approvals, Affiliate, Content Studio, Growth Director, Pages, then Calendar, Mandala, Staff, Systems, Import, Training.
- Operator links: Today, Ready, Scheduled, Published, Issues, then Calendar, Pages, Training.
- Below `lg`, Masho's five queues are a fixed bottom bar. Shahzeb gets a horizontal strip of the primary links. Desktop is the main layout.

The status line states that AI production, Facebook, Drive and affiliate networks are not connected. It is not a claim that scheduling is automated.

## Routes

| Route | Who | Role |
| --- | --- | --- |
| `/owner` | Shahzeb | Attention list, five-Page table, launch control |
| `/owner/approvals` | Shahzeb | Real review queue |
| `/owner/affiliate` | Shahzeb | Affiliate intelligence. Owner only. Figures stay "Not connected". |
| `/owner/studio` | Shahzeb | Seven-day production queue |
| `/owner/growth` | Shahzeb | Growth Director. No recommendation without evidence. |
| `/owner/pages` | Shahzeb | Page identities |
| `/staff` | Masho | Today |
| `/staff/ready` | Masho | Posts with a stored master file. Empty until one exists. |
| `/staff/scheduled` | Masho | Status `SCHEDULED` |
| `/staff/published` | Masho | Published and later metric statuses |
| `/staff/issues` | Masho | Regeneration flags |
| `/staff/tasks/[contentId]` | Masho | Publishing desk |
| `/owner/tasks/[contentId]` | Shahzeb | Pipeline brief and approval controls |

Calendar, training, Mandala, staff admin, import and systems stay on their existing routes. Server layouts still send an anonymous visitor to sign-in and a page operator away from owner routes.

## Components

- `src/components/asset-frame.tsx` — the media well. Stage size on a task, thumb size in a table.
- `src/components/publish-card.tsx` — Masho's card: Page, frame, topic, caption situation, UK time, readiness, primary action.
- `src/components/staff-queue.tsx` — the five operator lists.
- `src/components/owner-overview.tsx` — attention and the Page table. The launch control still requires an explicit confirm.
- `src/components/content-studio.tsx` — seven-day queue.
- `src/components/growth-director.tsx` — insufficient-evidence state.
- `src/components/operations.tsx` — affiliate intelligence tables.
- `src/components/task-workspace.tsx` — owner brief, and Masho's publishing actions.
- `src/preview/queues.ts` — which posts belong in Ready, Today, the seven-day window, and a missed publication. Ready requires an `http` asset reference. A sentence is not a file.

## Data rules

Real records: the 180 posts, five Pages, task status, flags, campaign phase, unresolved notes.

Not shown as numbers: organic reach, growth, outbound clicks, PPS conversions, commission, revenue and AI cost. Those cells say "Not connected" until Meta, the network or a model is actually connected. Masho does not see the affiliate tables.

No screen draws a generated Reel and calls it finished. Download, copy-caption and thumbnail actions stay unavailable without a file or a finished caption. "Open Meta Business Suite" leaves the app. Saving a Facebook URL uses the existing publication rules and does not post to Facebook.
