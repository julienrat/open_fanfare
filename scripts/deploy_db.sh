#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

DB_NAME="${DB_NAME:-openfanfare}"
DB_USER="${DB_USER:-openfanfare}"
DB_PASS="${DB_PASS:-changeme}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_SSLMODE="${DB_SSLMODE:-prefer}"
PG_SUPERUSER="${PG_SUPERUSER:-postgres}"

PSQL_BASE=(psql -p "$DB_PORT" -v ON_ERROR_STOP=1)

# If running as postgres locally, prefer socket (peer auth) to avoid password prompts.
if [ "$(id -un)" != "postgres" ]; then
  PSQL_BASE+=( -h "$DB_HOST" )
else
  if [ "$DB_HOST" != "127.0.0.1" ] && [ "$DB_HOST" != "localhost" ]; then
    PSQL_BASE+=( -h "$DB_HOST" )
  fi
fi

can_connect_as_user() {
  "${PSQL_BASE[@]}" -U "$DB_USER" -d postgres -c "SELECT 1" >/dev/null 2>&1
}

can_connect_as_super() {
  "${PSQL_BASE[@]}" -U "$PG_SUPERUSER" -d postgres -c "SELECT 1" >/dev/null 2>&1
}

if can_connect_as_user; then
  echo "Connexion OK avec l'utilisateur $DB_USER."
else
  echo "Connexion impossible avec l'utilisateur $DB_USER. Tentative avec $PG_SUPERUSER..."
  if ! can_connect_as_super; then
    echo "Impossible de se connecter avec $PG_SUPERUSER."
    echo "Si PostgreSQL est local, exécute:"
    echo "  sudo -u postgres bash scripts/deploy_db.sh"
    exit 1
  fi

  echo "Création du rôle et de la base si nécessaire..."
  "${PSQL_BASE[@]}" -U "$PG_SUPERUSER" -d postgres -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}') THEN CREATE ROLE \"${DB_USER}\" LOGIN PASSWORD '${DB_PASS}'; END IF; END \$\$;"
  "${PSQL_BASE[@]}" -U "$PG_SUPERUSER" -d postgres -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname='${DB_NAME}') THEN CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\"; END IF; END \$\$;"
fi

SCHEMA_FILE="$ROOT_DIR/database/schema.sql"
SEED_FILE="$ROOT_DIR/database/seed.sql"

if [ "$(id -un)" = "postgres" ]; then
  TMP_SCHEMA="/tmp/openfanfare_schema.sql"
  TMP_SEED="/tmp/openfanfare_seed.sql"
  cp "$SCHEMA_FILE" "$TMP_SCHEMA"
  cp "$SEED_FILE" "$TMP_SEED"
  "${PSQL_BASE[@]}" -U "$PG_SUPERUSER" -d "$DB_NAME" -f "$TMP_SCHEMA"
  "${PSQL_BASE[@]}" -U "$PG_SUPERUSER" -d "$DB_NAME" -f "$TMP_SEED"
  "${PSQL_BASE[@]}" -U "$PG_SUPERUSER" -d postgres -c "ALTER DATABASE \"${DB_NAME}\" OWNER TO \"${DB_USER}\";"
  "${PSQL_BASE[@]}" -U "$PG_SUPERUSER" -d "$DB_NAME" -c "ALTER SCHEMA public OWNER TO \"${DB_USER}\";"
  "${PSQL_BASE[@]}" -U "$PG_SUPERUSER" -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO \"${DB_USER}\";"
  "${PSQL_BASE[@]}" -U "$PG_SUPERUSER" -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON DATABASE \"${DB_NAME}\" TO \"${DB_USER}\";"
  "${PSQL_BASE[@]}" -U "$PG_SUPERUSER" -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO \"${DB_USER}\";"
  "${PSQL_BASE[@]}" -U "$PG_SUPERUSER" -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO \"${DB_USER}\";"
  "${PSQL_BASE[@]}" -U "$PG_SUPERUSER" -d "$DB_NAME" -c "DO \$\$ DECLARE r RECORD; BEGIN FOR r IN SELECT schemaname, tablename FROM pg_tables WHERE schemaname='public' LOOP EXECUTE 'ALTER TABLE '||quote_ident(r.schemaname)||'.'||quote_ident(r.tablename)||' OWNER TO \"${DB_USER}\"'; END LOOP; FOR r IN SELECT sequence_schema, sequence_name FROM information_schema.sequences WHERE sequence_schema='public' LOOP EXECUTE 'ALTER SEQUENCE '||quote_ident(r.sequence_schema)||'.'||quote_ident(r.sequence_name)||' OWNER TO \"${DB_USER}\"'; END LOOP; END \$\$;"
  "${PSQL_BASE[@]}" -U "$PG_SUPERUSER" -d "$DB_NAME" -c "GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO \"${DB_USER}\";"
else
  export PGPASSWORD="$DB_PASS"
  "${PSQL_BASE[@]}" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE"
  "${PSQL_BASE[@]}" -U "$DB_USER" -d "$DB_NAME" -f "$SEED_FILE"
fi

cat <<EOF
OK: base initialisée.
Connexion: postgresql://${DB_USER}:********@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=${DB_SSLMODE}
EOF
