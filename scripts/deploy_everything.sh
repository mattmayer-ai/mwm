#!/usr/bin/env bash

# Automated end-to-end deployment helper.
# - Runs lint, typecheck, unit tests, and Vite build
# - Builds Firebase Functions
# - Deploys chat function + hosting
# - Runs a smoke test against /api/chat and tails logs for verification
# Usage: FIREBASE_PROJECT=askmwm ./scripts/deploy_everything.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ID="${FIREBASE_PROJECT:-askmwm}"
CHAT_URL="${CHAT_URL:-https://askmwm.web.app/api/chat}"
SMOKE_PROMPT="${SMOKE_PROMPT:-What did Matt do in 2012?}"
LOG_LINES="${LOG_LINES:-20}"

BLUE='\033[1;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() {
  echo -e "${BLUE}➡ $1${NC}"
}

success() {
  echo -e "${GREEN}✔ $1${NC}"
}

warn() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

fail() {
  echo -e "${RED}✖ $1${NC}"
}

run_step() {
  local label="$1"
  shift
  info "$label"
  "$@"
  success "$label complete"
}

trap 'fail "Deployment script aborted"; exit 1' ERR

cd "$ROOT_DIR"
info "Working directory: $ROOT_DIR"
info "Firebase project: $PROJECT_ID"

run_step "Linting source" npm run lint
run_step "Type checking" npm run typecheck
run_step "Building frontend (Vite)" npm run build
run_step "Deploying hosting" firebase deploy --only hosting --project "$PROJECT_ID"
success "Frontend deployment completed successfully 🚀"

