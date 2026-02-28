#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${MEDUSA_BACKEND_URL:-}"
PUB_KEY="${MEDUSA_PUBLISHABLE_KEY:-}"
CHANNEL_NAME="${1:-S4 B2B}"

if [[ -z "$BASE_URL" || -z "$PUB_KEY" ]]; then
  echo "Missing MEDUSA_BACKEND_URL or MEDUSA_PUBLISHABLE_KEY"
  exit 1
fi

echo "Checking Medusa store visibility for sales channel: $CHANNEL_NAME"

STORE_JSON="$(curl -sS "$BASE_URL/store/products?limit=200" -H "x-publishable-api-key: $PUB_KEY")"
COUNT="$(echo "$STORE_JSON" | sed -n 's/.*"count"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p' | head -n1)"

if [[ -z "$COUNT" || "$COUNT" == "0" ]]; then
  echo "Store API returned zero visible products."
  echo "Verify products are published, assigned to sales channel '$CHANNEL_NAME', and priced in AED."
  exit 2
fi

echo "Visible products: $COUNT"
echo "OK: Store API has products for current publishable key"
