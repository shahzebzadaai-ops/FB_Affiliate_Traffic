# Security

Current controls:

- Owner setup runs only while the user table is empty. There is no public registration and no password in Git.
- Passwords are hashed with scrypt. Sessions are random tokens. Only the SHA-256 hash is stored. The cookie is HTTP-only.
- Owner routes and `/api/finance`, `/api/staff`, `/api/mandala` and campaign start check the session on the server.
- A disabled account cannot keep using an old session.
- Failed sign-in attempts are limited to eight in fifteen minutes per email and per IP.
- Do not enter real Google, Meta, affiliate or payout secrets.
- Finance figures are not shown because none exist. Do not seed fake revenue.
- Content must not use copied media, fake testimonials, misleading affiliate links or attempts to evade a platform.
- Single-parent content must not identify children. Casual By Choice must not use explicit imagery.
- UK affiliate content must be identifiable as advertising when a commercial link is added. UK data-protection work for real user accounts, analytics cookies and staff records starts with real authentication, not with this preview.
- Login, task changes, training, campaign start and disabled accounts write audit rows. Postback secrets do not exist yet.
- Production must set the session cookie `Secure` behind HTTPS. Local HTTP does not.
- The content bundle still contains the plan. Server checks are the access control.

Database backups are described in `DATA_MODEL.md`. The local development database is not yet on a backup schedule.
