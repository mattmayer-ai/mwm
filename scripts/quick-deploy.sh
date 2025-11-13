#!/bin/bash

# Quick deploy script - builds and deploys frontend only
# Usage: ./scripts/quick-deploy.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📦 Building frontend...${NC}"
npm run build

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Build successful${NC}"
  echo -e "${BLUE}🚀 Deploying to Firebase Hosting...${NC}"
  firebase deploy --only hosting
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${BLUE}🌐 Site: https://askmwm.web.app${NC}"
  else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
fi

