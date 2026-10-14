#!/bin/bash
# Repeatable release. Run on the VPS as the affigrove user after bootstrap.
# Does not reset the database, does not start the campaign, and does not print secrets.
set -euo pipefail

BRANCH="${AFFIGROVE_BRANCH:-cursor/affigrove-corporate-site-0a9d}"
ROOT="/var/www/affigrove"
ENV_FILE="/etc/affigrove/app.env"
REPO="${AFFIGROVE_REPO:-git@github.com:shahzebzadaai-ops/fb_affiliate_traffic.git}"

if [[ "$(id -un)" != "affigrove" ]]; then
  echo "Run this as the affigrove user." >&2
  exit 1
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy deploy/env.example and set the database password on the server." >&2
  exit 1
fi

mkdir -p "$ROOT/releases" "$ROOT/shared" "$ROOT/repo"
if [[ ! -d "$ROOT/repo/.git" ]]; then
  git clone --branch "$BRANCH" "$REPO" "$ROOT/repo"
fi
git -C "$ROOT/repo" fetch origin "$BRANCH"
git -C "$ROOT/repo" checkout "$BRANCH"
git -C "$ROOT/repo" reset --hard "origin/$BRANCH"
SHA="$(git -C "$ROOT/repo" rev-parse HEAD)"
RELEASE="$ROOT/releases/$SHA"
PREVIOUS=""
if [[ -L "$ROOT/current" ]]; then
  PREVIOUS="$(readlink -f "$ROOT/current")"
fi

if [[ ! -d "$RELEASE" ]]; then
  mkdir -p "$RELEASE"
  git -C "$ROOT/repo" archive "$SHA" | tar -x -C "$RELEASE"
  ln -sfn "$ENV_FILE" "$RELEASE/.env.local"
  # NODE_ENV=production would omit the TypeScript and Tailwind packages required to build.
  (cd "$RELEASE" && env -u NODE_ENV npm ci && npm run build)
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p /var/backups/affigrove
pg_dump --dbname="$DATABASE_URL" --format=custom --file="/var/backups/affigrove/affigrove-${STAMP}.dump"
find /var/backups/affigrove -name 'affigrove-*.dump' -mtime +14 -delete

(cd "$RELEASE" && node --experimental-strip-types scripts/db-production.ts)
ln -sfn "$RELEASE" "$ROOT/current"
sudo systemctl restart affigrove
sleep 2

if ! curl -fsS -H "Host: affigrove.io" "http://127.0.0.1:3100/api/public/health" | grep -q '"ok":true'; then
  echo "Health check failed. Restoring the previous release." >&2
  if [[ -n "$PREVIOUS" ]]; then
    ln -sfn "$PREVIOUS" "$ROOT/current"
    sudo systemctl restart affigrove
  fi
  exit 1
fi

echo "Deployed $SHA"
echo "Campaign status was printed by db-production. It is not changed by this script."
echo "Rollback: ln -sfn ${PREVIOUS:-$RELEASE} $ROOT/current && sudo systemctl restart affigrove"
