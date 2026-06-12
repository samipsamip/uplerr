FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
WORKDIR /app

# ── deps: install all workspace deps from repo root ──────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY src/types/package.json ./src/types/
COPY src/api/package.json ./src/api/
RUN pnpm install --frozen-lockfile

# ── builder: compile types then api ──────────────────────────────────────────
FROM deps AS builder
COPY src/types ./src/types
COPY src/api ./src/api
RUN pnpm --filter @uppler/types build
RUN pnpm --filter @uppler/api build

# ── runner: prod deps + built artifacts only ─────────────────────────────────
FROM node:24-slim AS runner
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

RUN apt-get update && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY src/types/package.json ./src/types/
COPY src/api/package.json ./src/api/
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

RUN pnpm --filter @uppler/api exec playwright install chromium --with-deps

COPY --from=builder /app/src/api/dist ./src/api/dist
COPY --from=builder /app/src/api/drizzle ./src/api/drizzle

COPY src/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["tini", "--", "./entrypoint.sh"]
