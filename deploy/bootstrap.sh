#!/bin/bash
# One-time server setup. Run as root on the Hostinger KVM after Ubuntu is installed.
# It does not delete databases, users, or firewall rules that already exist.
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run bootstrap as root." >&2
  exit 1
fi
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg nginx postgresql postgresql-contrib certbot python3-certbot-nginx apache2-utils ufw git

if ! command -v node >/dev/null || [[ "$(node -p process.versions.node)" != 22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

if ! id affigrove >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" affigrove
fi
install -d -o affigrove -g affigrove /var/www/affigrove /var/backups/affigrove /var/www/certbot
install -d -m 750 /etc/affigrove

if [[ ! -f /etc/affigrove/app.env ]]; then
  DB_PASSWORD="$(openssl rand -base64 24)"
  sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'affigrove') THEN
    CREATE ROLE affigrove LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SQL
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "SELECT 1 FROM pg_database WHERE datname = 'affigrove'" | grep -q 1 \
    || sudo -u postgres createdb --owner=affigrove affigrove
  umask 077
  cat > /etc/affigrove/app.env <<EOF
NODE_ENV=production
DATABASE_URL=postgres://affigrove:${DB_PASSWORD}@127.0.0.1:5432/affigrove
EOF
  chown root:affigrove /etc/affigrove/app.env
  chmod 640 /etc/affigrove/app.env
  unset DB_PASSWORD
fi

if [[ ! -f /etc/affigrove/review.htpasswd ]]; then
  REVIEW_PASSWORD="$(openssl rand -base64 18)"
  htpasswd -bc /etc/affigrove/review.htpasswd reviewer "$REVIEW_PASSWORD"
  umask 077
  printf 'reviewer %s\n' "$REVIEW_PASSWORD" > /etc/affigrove/review-password.txt
  chown root:www-data /etc/affigrove/review.htpasswd
  chown root:affigrove /etc/affigrove/review-password.txt
  chmod 640 /etc/affigrove/review.htpasswd /etc/affigrove/review-password.txt
  unset REVIEW_PASSWORD
fi

rm -f /etc/nginx/sites-enabled/default
systemctl enable --now nginx postgresql
install -m 644 "$SCRIPT_DIR/systemd/affigrove.service" /etc/systemd/system/affigrove.service
systemctl daemon-reload
systemctl enable affigrove

echo 'affigrove ALL=(root) NOPASSWD: /bin/systemctl restart affigrove, /bin/systemctl status affigrove' > /etc/sudoers.d/affigrove
chmod 440 /etc/sudoers.d/affigrove

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "Bootstrap finished. Database password and review password stay in /etc/affigrove and were not printed."
echo "Next: certbot certonly --webroot -w /var/www/certbot -d affigrove.io -d www.affigrove.io -d os.affigrove.io"
echo "Then run deploy/release.sh as the affigrove user."
