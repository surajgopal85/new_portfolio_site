#!/usr/bin/env bash
# One-time (and re-runnable) stack create/update.
#
#   bash infra/bootstrap.sh surajgop-portfolio-site
#   bash infra/bootstrap.sh surajgop-portfolio-site example.com arn:aws:acm:us-east-1:...:certificate/... Z123456
#
# The certificate must live in us-east-1 regardless of where you put the
# bucket — that's a CloudFront requirement, not a choice.
set -euo pipefail

STACK=${STACK:-portfolio-site}
BUCKET=${1:?usage: bootstrap.sh <bucket-name> [domain] [cert-arn] [hosted-zone-id]}
DOMAIN=${2:-}
CERT=${3:-}
ZONE=${4:-}

aws cloudformation deploy \
  --stack-name "$STACK" \
  --template-file "$(dirname "$0")/site.yaml" \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
    "BucketName=$BUCKET" \
    "DomainName=$DOMAIN" \
    "CertificateArn=$CERT" \
    "HostedZoneId=$ZONE"

echo
aws cloudformation describe-stacks --stack-name "$STACK" \
  --query 'Stacks[0].Outputs' --output table
echo "Copy those into infra/.env (see infra/.env.example)."
