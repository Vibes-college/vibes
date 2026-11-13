# SPDX-License-Identifier: AGPL-3.0-only
# Mia on Mastra (pilot): LAN test site only.
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server.mjs ./
ENV MASTRA_TELEMETRY_DISABLED=1 NODE_ENV=production
USER node
CMD ["node", "server.mjs"]
