#!/usr/bin/env bash
# End-to-end API test: migration on a throwaway PostgreSQL + real PostgREST
# (the REST engine Supabase uses) + the app's supabase-js queries/RPCs.
#
# Requires PostgreSQL 15+ server binaries. PostgREST is downloaded on first
# use unless POSTGREST_BIN points at an existing binary.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
export PATH="$PG_BIN:$PATH"

TMP="$(mktemp -d)"
PG_PORT="${PGTEST_PORT:-54330}"
API_PORT="${API_TEST_PORT:-54331}"
JWT_SECRET="local-test-secret-local-test-secret-123456"
PGRST_PID=""
cleanup() {
  [ -n "$PGRST_PID" ] && kill "$PGRST_PID" 2>/dev/null || true
  pg_ctl -D "$TMP/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

POSTGREST_BIN="${POSTGREST_BIN:-$ROOT/.cache/postgrest}"
if [ ! -x "$POSTGREST_BIN" ]; then
  mkdir -p "$(dirname "$POSTGREST_BIN")"
  echo "Downloading PostgREST v12.2.3…"
  curl -sSL https://github.com/PostgREST/postgrest/releases/download/v12.2.3/postgrest-v12.2.3-linux-static-x64.tar.xz \
    | tar -xJ -C "$(dirname "$POSTGREST_BIN")"
fi

RUN_AS=()
if [ "$(id -u)" = "0" ]; then
  chown -R postgres "$TMP" 2>/dev/null || true
  RUN_AS=(runuser -u postgres --)
fi

"${RUN_AS[@]}" initdb -D "$TMP/data" -U postgres --auth=trust >/dev/null
"${RUN_AS[@]}" pg_ctl -D "$TMP/data" -o "-p $PG_PORT -k $TMP -c listen_addresses=localhost" -l "$TMP/log" start >/dev/null

export PGOPTIONS="-c client_min_messages=warning"
PSQL=(psql -h "$TMP" -p "$PG_PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -f "$ROOT/supabase/tests/supabase-stubs.sql"
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261010000000_mini_closet_init.sql"
"${PSQL[@]}" <<'SQL'
insert into public.admin_emails (email) values ('admin1@minicloset.com');
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin1@minicloset.com', now(), '{"full_name":"Arti Chandra"}'),
  ('00000000-0000-0000-0000-0000000000c1', 'priya@example.com', now(), '{"full_name":"Priya Sharma"}'),
  ('00000000-0000-0000-0000-0000000000c2', 'neha@example.com', now(), '{}');
SQL

cat >"$TMP/postgrest.conf" <<CONF
db-uri = "postgres://authenticator@localhost:$PG_PORT/postgres"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$JWT_SECRET"
server-port = $API_PORT
CONF
"$POSTGREST_BIN" "$TMP/postgrest.conf" >"$TMP/postgrest.log" 2>&1 &
PGRST_PID=$!
for _ in $(seq 1 50); do
  curl -s -o /dev/null "http://localhost:$API_PORT/" && break
  sleep 0.2
done

cd "$ROOT"
API_TEST_URL="http://localhost:$API_PORT" API_TEST_JWT_SECRET="$JWT_SECRET" \
  npx vitest run src/lib/__tests__/api.integration.test.ts
