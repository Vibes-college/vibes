#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-only
# 上线词汇线小程序（/apps/vocab/）。只换 vocab 这一个容器，不碰社区、不重启社区。
#   sh miniapps/vocab/deploy.sh            局域网测试站：构建 vibes-app-vocab:<VERSION>，换上，查健康，打标签 vocab/v<VERSION>
#   sh miniapps/vocab/deploy.sh --rollback 换回上一次的版本（同 rollback.sh）
# 正式站（香港）的做法写在 冲刺1111/社区工程/小程序搬家/计划.md「上正式站」，要创始人点头，这个脚本现在不碰正式站。
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
MINI=$(dirname "$HERE")
SRC=$(dirname "$MINI")
COMPOSE_DIR=$(dirname "$SRC")
APP=vocab
STATE="$HOME/.vibes-apps"; mkdir -p "$STATE"
[ "${1:-}" = "--rollback" ] && exec sh "$HERE/rollback.sh"
LOCK=/tmp/vibes-app-$APP.lock
mkdir "$LOCK" 2>/dev/null || { echo "$APP 已经在上线或退回（如果确定没有，删掉 $LOCK）"; exit 1; }
trap 'rmdir "$LOCK"' EXIT

VERSION=$(cat "$HERE/VERSION")
if [ -n "$(git -C "$SRC" status --porcelain -- miniapps/$APP miniapps/_kit)" ]; then
  echo "miniapps/$APP 或 _kit 有没提交的改动，先提交再上线："; git -C "$SRC" status --porcelain -- miniapps/$APP miniapps/_kit; exit 1
fi
# 词表只有一份，在工作区 courses/english/ielts/（vocab.js 和线路 content.js）；社区和小程序里都是 sync-course.mjs 同步过来的副本。
for f in vocab.js content.js; do
  cmp -s "$SRC/packages/frontend/src/lojo/route/courses/ielts/$f" "$HERE/src/lojo/route/courses/ielts/$f" || \
    echo "注意：小程序里的 $f 和社区那份不一样，先跑 node apps/community/scripts/sync-course.mjs"
done

CUR=$(docker inspect -f '{{.Config.Image}}' "$(cd "$COMPOSE_DIR" && docker compose --profile apps ps -q $APP 2>/dev/null)" 2>/dev/null | sed 's/.*://' || true)
docker build -q -f "$HERE/Dockerfile" -t "vibes-app-$APP:$VERSION" "$MINI" >/dev/null
[ -n "$CUR" ] && [ "$CUR" != "$VERSION" ] && echo "$CUR" > "$STATE/$APP.prev"
cd "$COMPOSE_DIR"
APP_VOCAB_VERSION=$VERSION docker compose --profile apps up -d --no-deps $APP
i=0
until docker compose --profile apps exec -T $APP wget -qO- http://127.0.0.1:8080/healthz >/dev/null 2>&1; do
  i=$((i + 1)); [ $i -gt 30 ] && { echo "$APP v$VERSION 30 秒没起来，看 docker compose logs $APP；退回：sh $HERE/rollback.sh"; exit 1; }
  sleep 1
done
curl -fsS -o /dev/null http://127.0.0.1:4322/apps/$APP/ || { echo "门口 /apps/$APP/ 打不开"; exit 1; }
echo "$VERSION" > "$STATE/$APP.current"
git -C "$SRC" tag -f "$APP/v$VERSION" >/dev/null
echo "$APP v$VERSION 已上局域网测试站（上一版：${CUR:-无}），标签 $APP/v$VERSION"
docker stats --no-stream --format '{{.Name}} {{.MemUsage}}' "$(docker compose --profile apps ps -q $APP)"
