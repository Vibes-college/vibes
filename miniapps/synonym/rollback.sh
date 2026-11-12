#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-only
# 退回同义词连连看小程序：门口改发上一次的版本（或指定版本）。纯静态，不重启任何容器。
#   sh miniapps/synonym/rollback.sh          退回 deploy.sh 记下的上一版
#   sh miniapps/synonym/rollback.sh 0.1.0    退回指定版本（~/.vibes-apps/static/synonym/0.1.0/ 要还在）
# 要整个退回社区里的旧页面：见 冲刺1111/社区工程/小程序搬家/计划.md「退回」。
set -eu
APP=synonym
STATE="$HOME/.vibes-apps"; STATIC="$STATE/static/$APP"
TO=${1:-$(cat "$STATE/$APP.prev" 2>/dev/null || true)}
[ -n "$TO" ] || { echo "没有记下上一版，给个版本号：sh rollback.sh <版本>"; exit 1; }
[ -f "$STATIC/$TO/index.html" ] || { echo "没有 $STATIC/$TO/"; exit 1; }
LOCK=/tmp/vibes-app-$APP.lock
mkdir "$LOCK" 2>/dev/null || { echo "$APP 已经在上线或退回"; exit 1; }
trap 'rmdir "$LOCK"' EXIT
CUR=$(cat "$STATE/$APP.current" 2>/dev/null || true)
sh "$(dirname "$0")/serve.sh" "$TO"
[ -n "$CUR" ] && [ "$CUR" != "$TO" ] && echo "$CUR" > "$STATE/$APP.prev"
echo "$TO" > "$STATE/$APP.current"
echo "$APP 已退回 v$TO"
