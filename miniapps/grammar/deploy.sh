#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-only
# 上线语法课小程序（/apps/grammar/）。纯静态：打包好的文件放在 ~/.vibes-apps/static/grammar/<版本>/，
# 门口的 Caddy 发哪个版本写在 ~/.vibes-apps/static/grammar.root。上线就是改这一行、让门口 caddy reload（平滑换，
# 不断连接），不重启任何容器。（不用软链接改指向：Mac 的 Docker 文件共享会一直记着旧链接，换完是 400。）
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

CUR=$(cat "$STATE/$APP.current" 2>/dev/null || true)
docker build -q -f "$HERE/Dockerfile" -t "vibes-app-$APP:$VERSION" "$MINI" >/dev/null
rm -rf "$STATIC/$VERSION.new"
C=$(docker create "vibes-app-$APP:$VERSION")
docker cp -q "$C:/app/dist" "$STATIC/$VERSION.new"; docker rm "$C" >/dev/null
# 发出去的版本目录不改不删（正在发的文件被换掉会出错）：同一个版本号再上，内容必须一样；改了内容就先改 VERSION。
if [ -d "$STATIC/$VERSION" ]; then
  diff -rq "$STATIC/$VERSION" "$STATIC/$VERSION.new" >/dev/null || { rm -rf "$STATIC/$VERSION.new"; echo "v$VERSION 已经发过、内容不一样：先改 VERSION 和 CHANGELOG.md"; exit 1; }
  rm -rf "$STATIC/$VERSION.new"
else
  mv "$STATIC/$VERSION.new" "$STATIC/$VERSION"
fi
sh "$HERE/serve.sh" "$VERSION"
[ -n "$CUR" ] && [ "$CUR" != "$VERSION" ] && echo "$CUR" > "$STATE/$APP.prev"
curl -fsS http://127.0.0.1:4322/apps/$APP/6.1 | grep -q "/apps/$APP/assets/" || { echo "门口 /apps/$APP/ 打不开或不是新文件；退回：sh $HERE/rollback.sh"; exit 1; }
echo "$VERSION" > "$STATE/$APP.current"
git -C "$SRC" tag -f "$APP/v$VERSION" >/dev/null
echo "$APP v$VERSION 已上局域网测试站（上一版：${CUR:-无}），标签 $APP/v$VERSION；不占容器，文件 $(du -sh "$STATIC/$VERSION" | cut -f1)"
