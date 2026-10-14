# Hostinger KVM deployment

Do not deploy to the PlayerPulser server. Do not configure affigrove.com. Do not paste root passwords or private keys into Git or chat.

## What is true today

`affigrove.io` and `www.affigrove.io` answer from Hostinger DNS parking at `2.57.91.91`. The page says “Parked Domain name on Hostinger DNS system”. Nameservers are `aurora.dns-parking.com` and `nebula.dns-parking.com`. Port 22 on that address is closed. `os.affigrove.io` has no DNS record. That address is not the KVM2.

The application code is ready. The VPS is not reachable from this environment until the steps below are done.

## 1. Finish the VPS in hPanel

1. Open [hPanel](https://hpanel.hostinger.com/) → VPS → Manage on the KVM2.
2. If the panel still offers setup, install Ubuntu 24.04 LTS. Do not install a web control panel.
3. Open Settings → SSH keys → Add SSH key. Paste the one line in `deploy/affigrove_kvm.pub`. The private key stays on the deployment machine and is not in Git.
4. In Security → Firewall, allow SSH (22), HTTP (80), and HTTPS (443). Do not open PostgreSQL (5432).
5. Copy the VPS IPv4 from the overview. It must be a different address from `2.57.91.91`.

Hostinger’s browser terminal can be used for the root bootstrap. Do not copy the root password into chat.

## 2. Point the domain

In hPanel → Domains → affigrove.io → DNS / Nameservers, delete the parking A, AAAA, and CNAME records for `@` and `www`. Add:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | the VPS IPv4 |
| A | `www` | the VPS IPv4 |
| A | `os` | the VPS IPv4 |

Do not add affigrove.com. Wait until `dig +short A affigrove.io` and `dig +short A os.affigrove.io` both return the VPS IPv4, and port 22 accepts the SSH key.

## 3. First boot

On the server, as root, from a checkout of this branch:

```bash
bash deploy/bootstrap.sh
```

Bootstrap installs Ubuntu packages, Node.js 22, Nginx, PostgreSQL on localhost, a non-root `affigrove` user, UFW, and an environment file. It generates the database password and the temporary corporate review password on the server. It does not print them. Read the review password only on the server:

```bash
sudo cat /etc/affigrove/review-password.txt
```

Create a read-only GitHub deploy key for `shahzebzadaai-ops/fb_affiliate_traffic` and install it for the `affigrove` user. Then:

```bash
sudo -u affigrove bash /var/www/affigrove/repo/deploy/release.sh
sudo bash /var/www/affigrove/current/deploy/install-proxy.sh
```

`www.affigrove.io` redirects to `https://affigrove.io`. `os.affigrove.io` is the private sign-in and has no review password. Corporate pages stay `noindex` and behind the review password until launch approval. Remove the two `auth_basic` lines in `deploy/nginx/affigrove.conf` only when that approval is given.

## 4. Later releases and rollback

```bash
sudo -u affigrove bash /var/www/affigrove/current/deploy/release.sh
```

The script fetches `cursor/affigrove-corporate-site-0a9d`, builds that commit, dumps the database, applies additive migrations, and seeds only when the content table is empty. It does not reset the database and it does not start `uk-month-one`. If the health check fails, it switches the `current` symlink back and restarts.

Rollback without a database restore:

```bash
ln -sfn /var/www/affigrove/releases/PREVIOUS_SHA /var/www/affigrove/current
sudo systemctl restart affigrove
```

Restoring a dump replaces database data. Do not restore one unless the owner approves that specific restore.

Daily dumps are written by `deploy/backup.sh` to `/var/backups/affigrove/` and deleted after 14 days. Install it with cron as the `affigrove` user:

```cron
15 3 * * * /var/www/affigrove/current/deploy/backup.sh
```
