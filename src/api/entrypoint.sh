#!/usr/bin/env bash

set -euo pipefail

if [[ "${NODE_ENV:-}" == "production" ]]; then
    pnpm --filter @uppler/api run db:generate
    pnpm --filter @uppler/api run db:migrate
    pnpm --filter @uppler/api run db:seed
    exec pnpm --filter @uppler/api run start
else
    exec pnpm --filter @uppler/api run dev
fi
