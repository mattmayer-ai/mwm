#!/bin/bash

# Watch and auto-deploy script for mwm
# This script watches for file changes and automatically rebuilds and deploys

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting watch and deploy mode...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"

# Function to build and deploy
deploy() {
  echo -e "\n${GREEN}📦 Building frontend...${NC}"
  npm run build
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
    
    echo -e "\n${BLUE}🚀 Deploying to Firebase...${NC}"
    firebase deploy --only hosting
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ Deployment successful!${NC}"
      echo -e "${BLUE}🌐 Site: https://askmwm.web.app${NC}\n"
    else
      echo -e "${RED}❌ Deployment failed${NC}\n"
    fi
  else
    echo -e "${RED}❌ Build failed, skipping deployment${NC}\n"
  fi
}

# Initial deploy
deploy

# Watch for changes in src/ directory
echo -e "${BLUE}👀 Watching for changes in src/...${NC}"
fswatch -o src/ | while read f; do
  echo -e "\n${YELLOW}🔄 Change detected, rebuilding...${NC}"
  deploy
done

