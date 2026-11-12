#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-only
# 上线同义词连连看小程序（/apps/synonym/）。纯静态，不用打包：site/ 里的文件原样放进 ~/.vibes-apps/static/synonym/<版本>/，
# 只在 index.html 里加一行版本号（<meta name="vibes-version">），上线退回一眼看得出门口在发哪一版。
# 门口的 Caddy 发哪个版本写在 ~/.vibes-apps/static/synonym.root，上线就是改这一行、让门口 caddy reload（平滑换，不断连接），
# 不重启任何容器。做法和语法课一样（miniapps/grammar/deploy.sh）。
#   sh miniapps/synonym/deploy.sh            局域网测试站：放好，换上，查门口能打开，打标签 synonym/v<VERSION>
#   sh miniapps/synonym/deploy.sh --rollback 换回上一次的版本（同 rollback.sh）
# 唯一一份源文件在工作区 prototypes/synonym-match/（英语mini app 维护），site/ 是 apps/community/scripts/sync-synonym.sh 复制过来的副本。
# 正式站（香港）的做法写在 冲刺1111/社区工程/小程序搬家/正式站上线计划.md，要创始人点头，这个脚本现在不碰正式站。
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
SRC=$(dirname "$(dirname "$HERE")")
WORKSPACE=$(dirname "$(dirname "$(dirname "$SRC")")")
APP=synonym
STATE="$HOME/.vibes-apps"; STATIC="$STATE/static/$APP"; mkdir -p "$STATIC"
[ "${1:-}" = "--rollback" ] && exec sh "$HERE/rollback.sh"
LOCK=/tmp/vibes-app-$APP.lock
mkdir "$LOCK" 2>/dev/null || { echo "$APP 已经在上线或退回（如果确定没有，删掉 $LOCK）"; exit 1; }
trap 'rmdir "$LOCK"' EXIT

VERSION=$(cat "$HERE/VERSION")
if [ -n "$(git -C "$SRC" status --porcelain -- miniapps/$APP)" ]; then
  echo "miniapps/$APP 有没提交的改动，先提交再上线："; git -C "$SRC" status --porcelain -- miniapps/$APP; exit 1
fi
PROTO="$WORKSPACE/prototypes/synonym-match"
if [ -d "$PROTO" ] && [ "$(cat "$PROTO/VERSION")" = "$VERSION" ]; then
  for f in index.html css js sounds; do
    diff -rq "$PROTO/$f" "$HERE/site/$f" >/dev/null || echo "注意：site/$f 和 prototypes/synonym-match 不一样，先跑 sh apps/community/scripts/sync-synonym.sh"
  done
fi

CUR=$(cat "$STATE/$APP.current" 2>/dev/null || true)
rm -rf "$STATIC/$VERSION.new"
cp -R "$HERE/site" "$STATIC/$VERSION.new"
sed -i.bak "s|<meta charset=\"utf-8\">|<meta charset=\"utf-8\">\\
<meta name=\"vibes-version\" content=\"$VERSION\">|" "$STATIC/$VERSION.new/index.html"
rm -f "$STATIC/$VERSION.new/index.html.bak"
grep -q "name=\"vibes-version\" content=\"$VERSION\"" "$STATIC/$VERSION.new/index.html" || { rm -rf "$STATIC/$VERSION.new"; echo "index.html 里没找到 <meta charset=\"utf-8\">，版本号没加上"; exit 1; }
# 发出去的版本目录不改不删（正在发的文件被换掉会出错）：同一个版本号再上，内容必须一样；改了内容就先改 VERSION。
if [ -d "$STATIC/$VERSION" ]; then
  diff -rq "$STATIC/$VERSION" "$STATIC/$VERSION.new" >/dev/null || { rm -rf "$STATIC/$VERSION.new"; echo "v$VERSION 已经发过、内容不一样：先改 VERSION"; exit 1; }
  rm -rf "$STATIC/$VERSION.new"
else
  mv "$STATIC/$VERSION.new" "$STATIC/$VERSION"
fi
sh "$HERE/serve.sh" "$VERSION"
[ -n "$CUR" ] && [ "$CUR" != "$VERSION" ] && echo "$CUR" > "$STATE/$APP.prev"
curl -fsS http://127.0.0.1:4322/apps/$APP/ | grep -q "name=\"vibes-version\" content=\"$VERSION\"" || { echo "门口 /apps/$APP/ 打不开或不是 v$VERSION；退回：sh $HERE/rollback.sh"; exit 1; }
echo "$VERSION" > "$STATE/$APP.current"
git -C "$SRC" tag -f "$APP/v$VERSION" >/dev/null
echo "$APP v$VERSION 已上局域网测试站（上一版：${CUR:-无}），标签 $APP/v$VERSION；不占容器，文件 $(du -sh "$STATIC/$VERSION" | cut -f1)"
