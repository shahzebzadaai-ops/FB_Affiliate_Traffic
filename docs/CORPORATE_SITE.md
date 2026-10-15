# AffiGrove corporate site

Local preview: `http://127.0.0.1:3000/site`. Production is `https://affigrove.io`, and `www.affigrove.io` redirects there. The corporate host has no review password. It stays `noindex` until the facts under “Not approved for publication” are supplied.

## Where it lives

The public pages are a route group beside AffiGrove OS, not a replacement for it.

| Audience | Local URL | Later host |
| --- | --- | --- |
| Public site | `http://127.0.0.1:3000/site` | `affigrove.io` and `www.affigrove.io` |
| Private OS | `http://127.0.0.1:3000/` | `os.affigrove.io` |

OS routes are unchanged: `/`, `/owner`, `/staff`, `/join`, `/setup`, and `/api`. The Milky Way canvas is not rendered on `/site`. `src/proxy.ts` does nothing for localhost. On `affigrove.io` and `www.affigrove.io` it rewrites the public paths onto `/site`, redirects `/site/...` to the short path, and returns 404 for `/owner`, `/staff`, `/setup`, `/join`, and `/api` except `/api/public`. `os.affigrove.io` returns 404 for `/site`. `affigrove.com` is not a configured site. Requests for that host are refused because the domain was not purchased.

## Pages

Home, About, What we do, Approach, Careers, Contact, Privacy, and Terms. The homepage is a single cinematic page. Interior pages state the company name, the intended domains, and the public practices: storytelling, audience understanding, original work, and partnerships. The site does not state revenue, staff numbers, offices, clients, salaries, or private operations.

## Enquiries

Contact and careers forms post to `POST /api/public/enquiries`. A message is stored only after validation, an explicit consent checkbox, and a same-origin check. A hidden fax field is discarded. More than five attempts from the same network hash in an hour are refused. The network address is stored as a SHA-256 hash, not as the address. There is no mailer, so the form does not claim to send email.

`GET /api/enquiries` and `/owner/enquiries` require an account with `manage_users`. Publishing operators do not see the inbox. The owner navigation item is Enquiries.

## Not approved for publication

Registered company number, registered office, VAT, public email, public phone, postal address, director names, governing law, open roles, internship terms, work location, hosting vendor wording, and a message retention period.

Search indexing is off (`robots: noindex`). Do not add a sitemap or remove `noindex` until the unapproved company and privacy facts are supplied.

## Visual identity

The public homepage uses the night field `#111B16`, paper type `#F3EFE6`, Fraunces italic for selected words, and Source Sans 3. Background films live in `public/media/`. The header uses the supplied horizontal AffiGrove logo. Interior pages use the same dark tokens. AffiGrove OS uses SAP 72, the same night field behind the existing galaxy, and the supplied AffiGrove OS logo. Search indexing stays off until the unapproved company facts are supplied.

## Deployment

Not started. KVM2, DNS, certificates, and the reverse proxy stay in `docs/DEPLOYMENT_STRATEGY.md` as a plan. Do not run them from this repository until Shahzeb approves a launch.
