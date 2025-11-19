#!/usr/bin/env bash
# Helper to apply the mooc categories migration using psql.
# Usage:
#   export DATABASE_URL="postgres://user:pass@host:port/dbname"
#   ./scripts/apply_migration.sh

set -euo pipefail
MIGRATION_FILE="migrations/20251118_create_mooc_categories.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Migration file not found: $MIGRATION_FILE"
  exit 1
fi
if [ -z "${DATABASE_URL:-}" ]; then
  echo "Please set DATABASE_URL environment variable (Postgres connection string)"
  exit 1
fi

echo "Applying migration $MIGRATION_FILE to $DATABASE_URL"
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

echo "Done."
