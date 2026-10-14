#!/bin/bash
# Daily backup. Restoring a dump replaces database data and needs a separate approval.
set -euo pipefail
set -a
# shellcheck disable=SC1091
source /etc/affigrove/app.env
set +a
mkdir -p /var/backups/affigrove
cd /var/backups/affigrove
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
pg_dump --dbname="$DATABASE_URL" --format=custom --file="/var/backups/affigrove/affigrove-${STAMP}.dump"
find /var/backups/affigrove -name 'affigrove-*.dump' -mtime +14 -delete
echo "Wrote /var/backups/affigrove/affigrove-${STAMP}.dump"
