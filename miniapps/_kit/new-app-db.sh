#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-only
# 给一个新小程序开数据库：同一台 Postgres 里一个自己的账号 app_<名字> 和同名 schema，读不到社区的表。
# 密码随机生成，写进 apps/community/.env 的 APP_<名字>_DB_PASSWORD（不打印、不进 git）。已经有了就什么都不做。
#   sh source/miniapps/_kit/new-app-db.sh wordbook
set -eu
ID=$1
case "$ID" in *[!a-z0-9]*|"") echo "名字只能是小写字母和数字"; exit 1;; esac
COMPOSE_DIR=$(cd "$(dirname "$0")/../../.." && pwd)
cd "$COMPOSE_DIR"
VAR=APP_$(echo "$ID" | tr a-z A-Z)_DB_PASSWORD
ROLE=app_$ID
set -a; . ./.env; set +a
if ! grep -q "^$VAR=" .env; then
  PW=$(openssl rand -hex 24)
  printf '%s=%s\n' "$VAR" "$PW" >> .env
else
  PW=$(grep "^$VAR=" .env | head -1 | cut -d= -f2-)
fi
docker compose exec -T db psql -q -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -v role="$ROLE" -v pw="$PW" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'role', :'pw') WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'role') \gexec
SELECT format('ALTER ROLE %I PASSWORD %L', :'role', :'pw') \gexec
SELECT format('CREATE SCHEMA IF NOT EXISTS %I AUTHORIZATION %I', :'role', :'role') \gexec
SELECT format('REVOKE ALL ON SCHEMA public FROM %I', :'role') \gexec
SQL
echo "$ROLE 准备好了（密码在 .env 的 $VAR）"
