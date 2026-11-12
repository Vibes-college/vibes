# SPDX-License-Identifier: AGPL-3.0-only
# 生词本小程序。构建上下文是 miniapps/（要带上 _kit）：docker build -f wordbook/Dockerfile miniapps
FROM node:22-alpine AS build
WORKDIR /app
COPY wordbook/package.json wordbook/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY wordbook/ .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NODE_OPTIONS="--max-old-space-size=48 --disable-warning=ExperimentalWarning"
COPY wordbook/package.json wordbook/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY wordbook/server.mjs wordbook/VERSION wordbook/app.json wordbook/api.json ./
COPY _kit ./_kit
COPY wordbook/src/lib/lojo-words.ts ./src/lib/lojo-words.ts
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
CMD ["node", "--experimental-strip-types", "server.mjs"]
