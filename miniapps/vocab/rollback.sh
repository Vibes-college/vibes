#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-only
# 退回词汇线小程序：换回上一次的版本（或指定版本），只动 vocab 这一个容器。数据表只加不删，旧版本照样能读。
#   sh miniapps/vocab/rollback.sh          退回 deploy.sh 记下的上一版
#   sh miniapps/vocab/rollback.sh 0.1.0    退回指定版本（本机要有 vibes-app-vocab:0.1.0 这个镜像）
# 要整个退回社区里的旧页面：见 冲刺1111/社区工程/小程序搬家/计划.md「退回」。
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
COMPOSE_DIR=$(dirname "$(dirname "$(dirname "$HERE")")")
APP=vocab
STATE="$HOME/.vibes-apps"
TO=${1:-$(cat "$STATE/$APP.prev" 2>/dev/null || true)}
[ -n "$TO" ] || { echo "没有记下上一版，给个版本号：sh rollback.sh <版本>"; exit 1; }
docker image inspect "vibes-app-$APP:$TO" >/dev/null 2>&1 || { echo "本机没有 vibes-app-$APP:$TO"; exit 1; }
LOCK=/tmp/vibes-app-$APP.lock
mkdir "$LOCK" 2>/dev/null || { echo "$APP 已经在上线或退回"; exit 1; }
trap 'rmdir "$LOCK"' EXIT
cd "$COMPOSE_DIR"
APP_VOCAB_VERSION=$TO docker compose --profile apps up -d --no-deps $APP
echo "$TO" > "$STATE/$APP.current"
echo "$APP 已退回 v$TO"
