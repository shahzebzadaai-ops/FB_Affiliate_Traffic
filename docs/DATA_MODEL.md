# Data model

PostgreSQL and Drizzle are the development system of record. `npm run db:setup` applies `drizzle/0001_foundation.sql`, `drizzle/0002_operators.sql`, and `drizzle/0003_media_worker.sql`, then seeds the catalog. It does not delete users. Do not put media binaries or secrets in these tables. `media_workers` stores a token hash, not the token. `production_jobs` stores the server-built spec and, later, a result. Neither table stores a Reel.

Identity: `users`, `sessions`, `login_attempts`, `invitations`, `page_assignments`.

`social_pages` holds the five UK Pages. The code is the primary key. The slug is the future landing path segment, such as `back-in-the-game-uk`. The full brand bible remains in `src/domain/pages.ts` and `docs/PAGE_BRAND_BIBLES.md`. The table stores the short persona used for assignment.

`page_assignments` links a user to a Page. The pair is unique. Deleting a user removes the assignment. This is the live access list.

`invitations` stores the email, name, Page codes, expiry, and a SHA-256 token hash. The raw token is not stored.

`content_items` stores the 180 plan rows, including the historical assignee. `task_states` stores checklist, approval, schedule confirmation, publication URL, issue notes, regeneration flags, and metrics. Those fields are in Postgres, not only in the browser.

`training_progress` is one row per user and lesson key. Operators can write only a key that starts with their own person key.

`campaigns` row `uk-month-one` is the launch clock. It stays BUILD until an explicit start. `audit_events` records account, assignment, and task actions by user id.

Mandala tables are seeded as not started. They are owner planning data.

The UK market uses Europe/London. A time before the last Sunday in October is British Summer Time. After the clock change it is GMT. The plan anchor 12 October 2026 is a template, not a live launch.

Later visits, clicks, and postbacks should point at the same content id, for example `UK-BGUK-001`. Those tables are not created yet.

`drizzle/0005_muse_studio.sql` adds the manual creative desk: `creative_providers`, `provider_capabilities`, `creative_packages`, `creative_assets`, `provider_balances`, and `provider_usage_events`. Muse is the seed row `muse-web-studio`, type `EXTERNAL_MANUAL`, with eight capabilities left `UNTESTED`. The advertised one billion tokens are not inserted as a balance. Finished files are written under `AFFIGROVE_MEDIA_DIR` or `data/media-library`. The table stores the relative path, not a public URL, and no Muse password.

`drizzle/0006_intelligence.sql` adds `operating_controls`, `intelligence_reports`, `story_series`, `story_episodes`, and `story_clips`. Publishing is constrained to `OFF`. Story rows store the model id and whether live research was used. Clip rows store a relative path and a byte size, not the video itself. No Novita key is written into these tables.

The local development database is not backed up off this machine.
