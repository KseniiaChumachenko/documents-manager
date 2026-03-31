#!/bin/bash
# Start dev server and apply D1 migrations to miniflare's local database.
# The Cloudflare Vite plugin creates its own miniflare D1 instance which
# doesn't share state with `wrangler d1 migrations apply --local`.

set -e

MIGRATIONS_DIR="database/migrations"
MINIFLARE_DB_DIR=".wrangler/state/v3/d1/miniflare-D1DatabaseObject"

# Start the dev server in background
npm run dev &
DEV_PID=$!

# Wait for miniflare to create the D1 database file
echo "Waiting for miniflare D1 database..."
for i in $(seq 1 60); do
  if ls "$MINIFLARE_DB_DIR"/*.sqlite 1>/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Apply migrations to all miniflare D1 databases
for db in "$MINIFLARE_DB_DIR"/*.sqlite; do
  # Check if tables already exist
  tables=$(sqlite3 "$db" ".tables" 2>/dev/null || true)
  if echo "$tables" | grep -q "item"; then
    echo "Database $db already has tables, skipping migrations."
    continue
  fi

  echo "Applying migrations to $db..."
  for migration in "$MIGRATIONS_DIR"/*.sql; do
    # Remove drizzle's statement-breakpoint comments before executing
    sed 's/--> statement-breakpoint//g' "$migration" | sqlite3 "$db" 2>/dev/null || true
  done
  echo "Migrations applied."
done

# Seed default units if empty
for db in "$MINIFLARE_DB_DIR"/*.sqlite; do
  count=$(sqlite3 "$db" "SELECT COUNT(*) FROM unit;" 2>/dev/null || echo "0")
  if [ "$count" = "0" ]; then
    echo "Seeding default units..."
    sqlite3 "$db" "INSERT OR IGNORE INTO unit(name) VALUES ('штуки'),('метри'),('кілограми'),('години'),('доби'),('гривні');"
  fi
done

# Wait for the dev server process
wait $DEV_PID
