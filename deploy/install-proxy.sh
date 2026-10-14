#!/bin/bash
# Installs the Nginx site after the first release exists. Run as root.
set -euo pipefail
if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run install-proxy as root." >&2
  exit 1
fi
SOURCE="/var/www/affigrove/current/deploy/nginx"
if [[ ! -d "$SOURCE" ]]; then
  echo "Deploy a release before installing the proxy." >&2
  exit 1
fi
if [[ ! -f /etc/letsencrypt/live/affigrove.io/fullchain.pem ]]; then
  install -m 644 "$SOURCE/affigrove-http.conf" /etc/nginx/sites-available/affigrove.conf
  ln -sfn /etc/nginx/sites-available/affigrove.conf /etc/nginx/sites-enabled/affigrove.conf
  nginx -t
  systemctl reload nginx
  certbot certonly --webroot -w /var/www/certbot \
    -d affigrove.io -d www.affigrove.io -d os.affigrove.io \
    --agree-tos --register-unsafely-without-email --non-interactive
fi
install -m 644 "$SOURCE/affigrove.conf" /etc/nginx/sites-available/affigrove.conf
ln -sfn /etc/nginx/sites-available/affigrove.conf /etc/nginx/sites-enabled/affigrove.conf
nginx -t
systemctl reload nginx
echo "Proxy installed. Corporate review login is described in /etc/affigrove/review-password.txt"
