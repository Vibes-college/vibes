# SPDX-License-Identifier: AGPL-3.0-only
# 语法课小程序只打包前端，不跑服务器：deploy.sh 用这个镜像打包，再把 dist/ 拷出来交给门口的 Caddy 发文件。
# 构建上下文是 miniapps/（和别的小程序一样）：docker build -f grammar/Dockerfile miniapps
FROM node:22-alpine AS build
WORKDIR /app
COPY grammar/package.json grammar/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY grammar/ .
RUN npm run build
