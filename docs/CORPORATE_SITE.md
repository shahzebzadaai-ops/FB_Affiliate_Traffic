# AffiGrove corporate site

Local preview: `http://127.0.0.1:3000/site`. Production routing is prepared in `deploy/` and is not live. `www.affigrove.io` redirects to `https://affigrove.io`. The corporate host stays noindex, and the Nginx review password is created only on the server.

## Where it lives

The public pages are a route group beside Affiliate Traffic OS, not a replacement for it.

| Audience | Local URL | Later host |
| --- | --- | --- |
| Public site | `http://127.0.0.1:3000/site` | `affigrove.io` and `www.affigrove.io` |
| Private OS | `http://127.0.0.1:3000/` | `os.affigrove.io` |

OS routes are unchanged: `/`, `/owner`, `/staff`, `/join`, `/setup`, and `/api`. The Milky Way canvas is not rendered on `/site`. `src/proxy.ts` does nothing for localhost. On `affigrove.io` and `www.affigrove.io` it rewrites the public paths onto `/site`, redirects `/site/...` to the short path, and returns 404 for `/owner`, `/staff`, `/setup`, `/join`, and `/api` except `/api/public`. `os.affigrove.io` returns 404 for `/site`. `affigrove.com` is not a configured site. Requests for that host are refused because the domain was not purchased.

## Pages

Home, About, What we do, Approach, Careers, Contact, Privacy, and Terms. Copy states only the company name, the intended domains, and the four public practices: audience research, original content, technology, and performance marketing. It does not state revenue, staff numbers, offices, clients, salaries, or the private operating system.

## Enquiries

Contact and careers forms post to `POST /api/public/enquiries`. A message is stored only after validation, an explicit consent checkbox, and a same-origin check. A hidden fax field is discarded. More than five attempts from the same network hash in an hour are refused. The network address is stored as a SHA-256 hash, not as the address. There is no mailer, so the form does not claim to send email.

`GET /api/enquiries` and `/owner/enquiries` require an account with `manage_users`. Publishing operators do not see the inbox. The owner navigation item is Enquiries.

## Not approved for publication

Registered company number, registered office, VAT, public email, public phone, postal address, director names, governing law, open roles, internship terms, work location, hosting vendor wording, and a message retention period.

Search indexing is off (`robots: noindex`) until a launch is approved.

## Visual identity

The public site uses Fraunces and Source Sans 3, paper `#f3efe6`, ink `#1a241c`, and grove green `#1a5c42`. Affiliate Traffic OS keeps Be Vietnam Pro, the navy field, and the Milky Way canvas. The two identities are separate on purpose.

## Deployment

Not started. KVM2, DNS, certificates, and the reverse proxy stay in `docs/DEPLOYMENT_STRATEGY.md` as a plan. Do not run them from this repository until Shahzeb approves a launch.
