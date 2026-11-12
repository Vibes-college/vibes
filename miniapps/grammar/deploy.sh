#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-only
# 上线语法课小程序（/apps/grammar/）。纯静态：打包好的文件放在 ~/.vibes-apps/static/grammar/<版本>/，
# 门口的 Caddy 发 ~/.vibes-apps/static/grammar/current/ 里的文件。上线就是把 current 指到新版本，不重启任何容器。
#   sh miniapps/grammar/deploy.sh            局域网测试站：打包，换上，查门口能打开，打标签 grammar/v<VERSION>
#   sh miniapps/grammar/deploy.sh --rollback 换回上一次的版本（同 rollback.sh）
# 正式站（香港）的做法写在 冲刺1111/社区工程/小程序搬家/正式站上线计划.md，要创始人点头，这个脚本现在不碰正式站。
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
MINI=$(dirname "$HERE")
SRC=$(dirname "$MINI")
APP=grammar
STATE="$HOME/.vibes-apps"; STATIC="$STATE/static/$APP"; mkdir -p "$STATIC"
[ "${1:-}" = "--rollback" ] && exec sh "$HERE/rollback.sh"
LOCK=/tmp/vibes-app-$APP.lock
mkdir "$LOCK" 2>/dev/null || { echo "$APP 已经在上线或退回（如果确定没有，删掉 $LOCK）"; exit 1; }
trap 'rmdir "$LOCK"' EXIT

VERSION=$(cat "$HERE/VERSION")
if [ -n "$(git -C "$SRC" status --porcelain -- miniapps/$APP)" ]; then
  echo "miniapps/$APP 有没提交的改动，先提交再上线："; git -C "$SRC" status --porcelain -- miniapps/$APP; exit 1
fi
# 课程只有一份，在工作区 courses/english/ielts/（grammar.js 和线路 content.js）；社区和小程序里都是 sync-course.mjs 同步过来的副本。
for f in grammar.js content.js; do
  cmp -s "$SRC/packages/frontend/src/lojo/route/courses/ielts/$f" "$HERE/src/lojo/route/courses/ielts/$f" || \
    echo "注意：小程序里的 $f 和社区那份不一样，先跑 node apps/community/scripts/sync-course.mjs"
done

CUR=$(readlink "$STATIC/current" 2>/dev/null || true)
docker build -q -f "$HERE/Dockerfile" -t "vibes-app-$APP:$VERSION" "$MINI" >/dev/null
rm -rf "$STATIC/$VERSION.new"
C=$(docker create "vibes-app-$APP:$VERSION")
docker cp -q "$C:/app/dist" "$STATIC/$VERSION.new"; docker rm "$C" >/dev/null
rm -rf "$STATIC/$VERSION"; mv "$STATIC/$VERSION.new" "$STATIC/$VERSION"
# 一步换过去：先做一个新的链接，再改名盖掉 current（改名是原子的，换的那一下也不会 404）
ln -sfn "$VERSION" "$STATIC/.current.$$"
python3 -c 'import os,sys; os.replace(sys.argv[1], sys.argv[2])' "$STATIC/.current.$$" "$STATIC/current"
[ -n "$CUR" ] && [ "$CUR" != "$VERSION" ] && echo "$CUR" > "$STATE/$APP.prev"
curl -fsS http://127.0.0.1:4322/apps/$APP/6.1 | grep -q "/apps/$APP/assets/" || { echo "门口 /apps/$APP/ 打不开或不是新文件；退回：sh $HERE/rollback.sh"; exit 1; }
echo "$VERSION" > "$STATE/$APP.current"
git -C "$SRC" tag -f "$APP/v$VERSION" >/dev/null
echo "$APP v$VERSION 已上局域网测试站（上一版：${CUR:-无}），标签 $APP/v$VERSION；不占容器，文件 $(du -sh "$STATIC/$VERSION" | cut -f1)"
