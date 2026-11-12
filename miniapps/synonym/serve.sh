#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-only
# 让门口（Caddy）改发同义词连连看的某个版本：sh serve.sh <版本>。deploy.sh 和 rollback.sh 都用它。
# 写 ~/.vibes-apps/static/synonym.root（Caddyfile 里 import 它），再 caddy reload：先检查新设置，不对就不换；
# 换的时候已经连着的请求照常走完。改这一行用原地写入，不换文件（Mac 的 Docker 文件共享对「换掉的文件名」会记旧的）。
set -eu
APP=synonym
VER=$1
COMMUNITY=$(cd "$(dirname "$0")/../../.." && pwd)
ROOT_FILE="$HOME/.vibes-apps/static/$APP.root"
[ -f "$HOME/.vibes-apps/static/$APP/$VER/index.html" ] || { echo "没有 ~/.vibes-apps/static/$APP/$VER/"; exit 1; }
OLD=$(cat "$ROOT_FILE" 2>/dev/null || true)
printf 'root * /srv/apps/%s/%s\n' "$APP" "$VER" > "$ROOT_FILE"
if ! (cd "$COMMUNITY" && docker compose --profile gateway exec -T gateway caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1); then
  [ -n "$OLD" ] && printf '%s\n' "$OLD" > "$ROOT_FILE"
  echo "门口没换成 $VER（caddy reload 失败），还在发原来的版本"; exit 1
fi
