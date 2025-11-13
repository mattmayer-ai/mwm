#!/bin/bash

# Full deploy script - builds and deploys everything (functions + hosting)
# Usage: ./scripts/full-deploy.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📦 Building frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Frontend build failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Frontend build successful${NC}"

echo -e "\n${BLUE}📦 Building functions...${NC}"
cd functions
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Functions build failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Functions build successful${NC}"
cd ..

echo -e "\n${BLUE}🚀 Deploying to Firebase...${NC}"
echo -e "${YELLOW}This will deploy both functions and hosting${NC}\n"

firebase deploy

if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✅ Full deployment successful!${NC}"
  echo -e "${BLUE}🌐 Site: https://askmwm.web.app${NC}"
  echo -e "${BLUE}⚡ Functions: https://us-central1-askmwm.cloudfunctions.net${NC}"
else
  echo -e "${RED}❌ Deployment failed${NC}"
  exit 1
fi

