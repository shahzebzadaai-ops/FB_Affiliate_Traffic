# Deployment strategy

APPROVED: do not deploy this app to the PlayerPulser VPS. Do not change Nginx, DNS or `os.azvoraglobal.io`. Do not buy hosting in this milestone.

The existing VPS at 187.53.130.227 runs PlayerPulser. Affiliate Traffic OS is not deployed there.

Long-term preference is a separate machine or a managed host that supports Node.js, PostgreSQL, a background worker and backups. A dedicated KVM 2 is the candidate. No purchase is authorized.

If a staging host is approved later, use a separate user, directory, database, environment and port 3100. Do not expose development setup on the public internet without real accounts, which this app now has, and without HTTPS.

Local development uses PostgreSQL on the same machine as `npm run dev`. `DATABASE_URL` lives in `.env.local`, which is not committed. That database is not production and is not off-site backed up.

The private OS, a future public site, the database, workers and tracking ingestion should stay separable. They are one Next.js app today.
