# Hostinger KVM deployment

Do not deploy to the PlayerPulser server. Do not configure affigrove.com. Do not paste root passwords or private keys into Git or chat.

## What is true today

The AffiGrove KVM2 is Ubuntu 24.04 at `153.92.208.28`. SSH key `affigrove-kvm-deploy` logs in as root. DNS is:

| Name | Record |
| --- | --- |
| `affigrove.io` | A `153.92.208.28` |
| `www.affigrove.io` | CNAME `affigrove.io` |
| `os.affigrove.io` | A `153.92.208.28` |

Do not use the PlayerPulser Hostinger account or `187.53.130.227`. Do not configure affigrove.com.

The GitHub repository is private. `deploy/release.sh` fetches it with a read-only deploy key. Until that key exists, copy this checkout to `/var/www/affigrove/repo` and run the release with `AFFIGROVE_SKIP_FETCH=1`. Do not copy this environment's GitHub credentials onto the VPS.

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

Without a deploy key, from a copy of this branch already checked out at `/var/www/affigrove/repo`:

```bash
sudo -u affigrove env AFFIGROVE_SKIP_FETCH=1 bash /var/www/affigrove/repo/deploy/release.sh
sudo bash /var/www/affigrove/current/deploy/install-proxy.sh
```

`www.affigrove.io` redirects to `https://affigrove.io`. `os.affigrove.io` is the private sign-in. The corporate host has no review password. Pages stay `noindex` until the company number, registered office, public contact details, governing law, and privacy hosting statement are approved. Do not add `auth_basic` back.

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
