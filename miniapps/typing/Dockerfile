# SPDX-License-Identifier: AGPL-3.0-only
# 机考打字小程序。构建上下文是 miniapps/（要带上 _kit）：docker build -f typing/Dockerfile miniapps
# 第一步打包前端，第二步只带运行要的东西，跑起来只有一个 Node 进程。
FROM node:22-alpine AS build
WORKDIR /app
COPY typing/package.json typing/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY typing/ .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NODE_OPTIONS="--max-old-space-size=48 --disable-warning=ExperimentalWarning"
COPY typing/package.json typing/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY typing/server.mjs typing/VERSION typing/app.json typing/api.json ./
COPY _kit ./_kit
COPY typing/src/lojo/typing/record.ts ./src/lojo/typing/record.ts
COPY typing/src/lojo/route/courses/ielts/typing.js ./src/lojo/route/courses/ielts/typing.js
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
CMD ["node", "--experimental-strip-types", "server.mjs"]
