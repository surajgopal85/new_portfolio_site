#!/usr/bin/env bash
# Build, upload, invalidate.
#
# Two cache rules, which is the whole trick to a static site feeling instant:
#   /_next/static/*  content-hashed filenames  -> cache for a year, immutable
#   everything else  stable filenames          -> must-revalidate, and we
#                                                 invalidate on every deploy
set -euo pipefail

cd "$(dirname "$0")/.."
[ -f infra/.env ] && set -a && . infra/.env && set +a

: "${SITE_BUCKET:?set SITE_BUCKET in infra/.env}"
: "${DISTRIBUTION_ID:?set DISTRIBUTION_ID in infra/.env}"

echo "==> build"
npm run build

echo "==> upload immutable assets"
aws s3 sync out/_next/static "s3://$SITE_BUCKET/_next/static" \
  --delete \
  --cache-control "public,max-age=31536000,immutable"

echo "==> upload everything else"
aws s3 sync out "s3://$SITE_BUCKET" \
  --delete \
  --exclude "_next/static/*" \
  --cache-control "public,max-age=0,must-revalidate"

echo "==> invalidate"
ID=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths '/*' \
  --query 'Invalidation.Id' --output text)
echo "invalidation $ID created"
