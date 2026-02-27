#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

if [[ ! -f ".env.local" ]]; then
  echo "Missing $APP_DIR/.env.local"
  echo "Create it first from .env.example with production values."
  exit 1
fi

BRANCH="${1:-main}"

echo "[1/5] Updating code from origin/$BRANCH"
git fetch --all --prune
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "[2/5] Installing dependencies"
npm ci

echo "[3/5] Building Next.js app"
npm run build

echo "[4/5] Restarting PM2 app"
if pm2 describe s4-shop >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi

echo "[5/5] Saving PM2 state"
pm2 save

echo "Deploy complete."
