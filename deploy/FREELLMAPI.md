# FreeLLMAPI on the AffiGrove VPS

These steps are prepared and not applied. Do not run them until the owner approves a production deployment.

The live OS is the Hostinger KVM2 at `153.92.208.28`. Nginx publishes `affigrove.io`, `www.affigrove.io`, and `os.affigrove.io`, and proxies them to `127.0.0.1:3100`. The process is `affigrove.service`. PostgreSQL listens on localhost. UFW allows SSH, port 80, and port 443.

The FreeLLMAPI router used for development is not on that VPS. It runs on the development machine, bound to `127.0.0.1:3001`. Production still serves the Muse release and does not have this router, the unified key, or the intelligence migration.

## What stays private

- Bind the router with `HOST=127.0.0.1` and `PORT=3001`. The upstream default listens on every interface when `HOST` is unset. Do not leave it unset.
- Do not add a Nginx server or location for port 3001.
- Do not allow port 3001 in UFW or the Hostinger firewall.
- Do not print provider keys, the unified key, `ENCRYPTION_KEY`, or `router.env`.
- The dashboard is the same local port. Reach it with an SSH tunnel, then close the tunnel:

```bash
ssh -L 3001:127.0.0.1:3001 root@153.92.208.28
```

Open `http://127.0.0.1:3001` on the machine that opened the tunnel.

## Install, when approved

Run on the VPS as root. Build FreeLLMAPI from a reviewed checkout. Do not run a remote install script.

```bash
id freellmapi >/dev/null 2>&1 || adduser --disabled-password --gecos "" freellmapi
install -d -o root -g freellmapi -m 750 /etc/freellmapi
install -d -o freellmapi -g freellmapi -m 700 /var/lib/freellmapi /opt/freellmapi
```

Copy the built router into `/opt/freellmapi` and keep `server/dist` owned by `freellmapi`. Create `/etc/freellmapi/router.env` on the server, mode `640`, owner `root:freellmapi`:

```bash
HOST=127.0.0.1
PORT=3001
NODE_ENV=production
FREEAPI_DB_PATH=/var/lib/freellmapi/freeapi.db
ENCRYPTION_KEY=<64 hex characters generated on the server>
```

Generate the encryption key on the server with `openssl rand -hex 32`. Do not copy the development key. A new key cannot read the development database, so add the Groq key again through the local dashboard API after the service is up. The Groq key is stored encrypted in `freeapi.db`. It does not go in `router.env`, the systemd unit, Git, or the AffiGrove environment file.

```bash
install -o root -g root -m 644 deploy/systemd/freellmapi.service /etc/systemd/system/freellmapi.service
systemctl daemon-reload
systemctl enable --now freellmapi
bash deploy/freellmapi-health.sh
ss -ltnp | awk '$4 ~ /:3001$/ { print }'
```

The socket line must show `127.0.0.1:3001` only. `affigrove.service` does not depend on this unit. The OS keeps serving if the router stops.

After the health check, sign in through the SSH tunnel and add the Groq key with the dashboard's key API. Create the router's unified key there. Put only that unified key in `/etc/affigrove/app.env`:

```bash
LANGUAGE_PROVIDER=freellmapi
FREELLMAPI_API_KEY=<unified key created on the server>
FREELLMAPI_MODEL=openai/gpt-oss-120b
FREELLMAPI_FALLBACK_MODEL=openai/gpt-oss-20b
FREELLMAPI_BASE_URL=http://127.0.0.1:3001/v1
```

Keep `NOVITA_API_KEY` unset unless the owner sets `LANGUAGE_PROVIDER=novita` on purpose. Restart AffiGrove after that edit:

```bash
systemctl restart affigrove
```

Applying the intelligence migration and choosing a release branch are separate from starting the router. `deploy/release.sh` still fetches `cursor/affigrove-corporate-site-0a9d`. Do not point it at this branch until the owner chooses the release.

## Rollback

```bash
systemctl disable --now freellmapi
```

Remove `LANGUAGE_PROVIDER`, `FREELLMAPI_API_KEY`, `FREELLMAPI_MODEL`, `FREELLMAPI_FALLBACK_MODEL`, and `FREELLMAPI_BASE_URL` from `/etc/affigrove/app.env`, then `systemctl restart affigrove`. Story generation becomes unavailable. The OS, the 180 content rows, Muse Studio, and publishing stay as they were. Leave `/var/lib/freellmapi` in place so the encrypted database can be started again. Delete that directory only when the owner says the keys should be destroyed.

## Resources

The router is one Node process and one SQLite file. It does not need a public port, a second database server, or a GPU. Co-hosting it with the OS is the intended layout when the VPS still has free memory and disk after the measurement recorded with the deployment approval. If that measurement shows the box is already short of memory, do not install the router there.
