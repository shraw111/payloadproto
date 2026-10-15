#!/usr/bin/env bash
# Production start: apply database migrations, seed the demo content once, then start Next.js.
set -euo pipefail

DB_URI="${DATABASE_URI:-file:./data/app.db}"
DB_FILE="${DB_URI#file:}"
DATA_DIR="$(dirname "$DB_FILE")"
mkdir -p "$DATA_DIR" "${MEDIA_DIR:-./media}"

echo "[start] Applying database migrations"
npx payload migrate

# Seed once. The marker lives next to the database (on the volume), so a restart never overwrites changes made in the admin.
if [ ! -f "$DATA_DIR/.seeded" ]; then
  echo "[start] First boot: seeding demo content"
  npx payload run src/seed/seed.ts
  touch "$DATA_DIR/.seeded"
fi

echo "[start] Starting on port ${PORT:-3000}"
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
