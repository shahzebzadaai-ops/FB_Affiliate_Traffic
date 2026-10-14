# Security

Current controls:

- Owner setup runs only while the user table is empty. There is no public registration and no password in Git.
- Passwords are hashed with scrypt. Sessions are random tokens. Only the SHA-256 hash is stored. The cookie is HTTP-only, SameSite Lax, and Secure only in production.
- Invitation tokens are random, shown once, and stored as a SHA-256 hash. They expire after seven days and cannot be reused.
- Owner routes and `/api/finance`, `/api/staff`, `/api/mandala`, `/api/assignments` changes, and campaign start check the session on the server.
- An operator's work, task commands, and training are limited to that account's Page assignments and person key. Another operator's name is not included in that payload. Revision actors other than the caller are returned as `operator`.
- A disabled account cannot keep using an old session.
- Failed sign-in attempts are limited to eight in fifteen minutes per email and per IP.
- Do not enter real Google, Meta, affiliate or payout secrets.
- Finance figures are not shown because none exist. Do not seed fake revenue.
- Content must not use copied media, fake testimonials, misleading affiliate links or attempts to evade a platform.
- Single-parent content must not identify children. Casual By Choice must not use explicit imagery.
- UK affiliate content must be identifiable as advertising when a commercial link is added.
- Login, task changes, training, invitations, Page assignments, campaign start, and disabled accounts write audit rows. Those rows are not shown to operators. Postback secrets do not exist yet.
- The operator publishing screens do not import the plan JSON or the staff list. Owner screens still do. A downloaded owner JavaScript file can contain the historical assignee id. That is not authorization. The server rejects the request.
- Meta Business Suite can reveal Page access that this application cannot hide.
- An unpaid training period needs Shahzeb's own employment check. This app does not treat it as lawful by default.

Database backups are described in `DATA_MODEL.md`. The local development database is not yet on a backup schedule.
