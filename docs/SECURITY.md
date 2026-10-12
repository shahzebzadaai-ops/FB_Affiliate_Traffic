# Security

Phase 1 limitations, stated plainly:

- Preview identities are buttons. They are not accounts, sessions or passwords.
- There is no server-side authorisation. Hiding a link is not access control.
- Do not enter real Google, Meta, affiliate or payout secrets into the preview.
- No public registration and no hardcoded password.
- Finance figures are not shown because none exist. Do not seed fake revenue to make the dashboard look finished.
- Content must not use copied media, fake testimonials, misleading affiliate links or attempts to evade a platform.
- Single-parent content must not identify children. Casual By Choice must not use explicit imagery.
- UK affiliate content must be identifiable as advertising when a commercial link is added. UK data-protection work for real user accounts, analytics cookies and staff records starts with real authentication, not with this preview.
- The next milestone must hash credentials with a maintained auth library, enforce permissions on the server, write an audit log, and keep postback secrets server-side only.

Database backups are described in `DATA_MODEL.md` and apply once Postgres exists.
