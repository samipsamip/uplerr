#!/usr/bin/env bash

set -euo pipefail

if [[ "${NODE_ENV:-}" != "production" ]]; then
    pnpm run db:seed
else
    pnpm run dev
fi