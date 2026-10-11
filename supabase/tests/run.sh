#!/usr/bin/env bash
# Runs the migration + behavioural tests against a throwaway local PostgreSQL
# cluster (requires PostgreSQL 15+ server binaries: initdb, pg_ctl, psql).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
export PATH="$PG_BIN:$PATH"

TMP="$(mktemp -d)"
PORT="${PGTEST_PORT:-54329}"
cleanup() { pg_ctl -D "$TMP/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT

RUN_AS=()
if [ "$(id -u)" = "0" ]; then
  chown -R postgres "$TMP" 2>/dev/null || true
  RUN_AS=(runuser -u postgres --)
fi

"${RUN_AS[@]}" initdb -D "$TMP/data" -U postgres --auth=trust >/dev/null
"${RUN_AS[@]}" pg_ctl -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -l "$TMP/log" start >/dev/null

export PGOPTIONS="-c client_min_messages=warning"
PSQL=(psql -h "$TMP" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -f "$ROOT/supabase/tests/supabase-stubs.sql"
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261010000000_mini_closet_init.sql"
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261011000000_more_sizes.sql"
echo "Migration applied. Re-applying to check idempotency…"
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261010000000_mini_closet_init.sql"
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261011000000_more_sizes.sql"
"${PSQL[@]}" -o /dev/null -f "$ROOT/supabase/tests/behaviour.sql"

echo "Concurrency: 6 parallel checkouts racing for the last unit of a product…"
"${PSQL[@]}" -c "update public.products set stock = 1, is_active = true where slug = 'ajrakh-print-co-ord-set'"
for n in 1 2 3 4 5 6; do
  "${PSQL[@]}" -o /dev/null -c "
    select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c2', false);
    set role authenticated;
    select pg_sleep(0.2);
    select public.place_order('[{\"product_id\":\"6f1c2a9e-0001-4a4b-9c1d-000000000012\",\"size\":\"Free Size\",\"quantity\":1}]',
      'Neha Verma', '7012345678', 'Flat 4B, Lake View Apartments', 'Kolkata', 'West Bengal', '700091');" \
    >"$TMP/race-$n.log" 2>&1 &
done
wait
SOLD=$("${PSQL[@]}" -At -c "select count(*) from public.order_items where product_slug = 'ajrakh-print-co-ord-set'")
STOCK=$("${PSQL[@]}" -At -c "select stock from public.products where slug = 'ajrakh-print-co-ord-set'")
REJECTED=$(grep -l INSUFFICIENT_STOCK "$TMP"/race-*.log | wc -l)
echo "  sold=$SOLD stock_left=$STOCK rejected=$REJECTED"
if [ "$SOLD" != "1" ] || [ "$STOCK" != "0" ] || [ "$REJECTED" != "5" ]; then
  echo "Concurrency test FAILED"; cat "$TMP"/race-*.log; exit 1
fi

echo "All database tests passed."
