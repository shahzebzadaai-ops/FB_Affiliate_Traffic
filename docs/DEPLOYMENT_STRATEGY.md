# Deployment strategy

APPROVED: do not deploy this app to the PlayerPulser VPS. Do not change Nginx, DNS or `os.azvoraglobal.io`. Do not deploy to the Hostinger KVM2 until Shahzeb approves a launch of the finished local site.

The existing VPS at 187.53.130.227 runs PlayerPulser. Affiliate Traffic OS is not deployed there. Do not use that machine for AffiGrove.

Shahzeb has purchased a Hostinger KVM2 and the domain affigrove.io. affigrove.com is not purchased and must not be added as a site. The purchased server is not provisioned from this repository. No DNS change, certificate request, firewall change, or process install is authorised yet.

When a launch is approved, the intended shape is one machine with two hostnames: `affigrove.io` and `www.affigrove.io` for the public site, and `os.affigrove.io` for the private OS. HTTPS, a reverse proxy, a private database with backups, secrets outside the frontend, and a rollback path come before either hostname is opened. The Facebook publishing switch stays off. `src/proxy.ts` already encodes the host split for those names and does nothing on localhost.

If a staging host is approved later, use a separate user, directory, database, environment and port 3100. Do not expose development setup on the public internet without real accounts, which this app now has, and without HTTPS.

Local development uses PostgreSQL on the same machine as `npm run dev`. `DATABASE_URL` lives in `.env.local`, which is not committed. That database is not production and is not off-site backed up.

The private OS, the public site, the database, workers and tracking ingestion should stay separable. They are one Next.js app today. The public pages are local under `/site`.
