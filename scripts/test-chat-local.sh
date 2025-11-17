#!/usr/bin/env bash
# Script to test chat function locally
# Usage: ./scripts/test-chat-local.sh

set -e

echo "🧪 Chat Function Local Testing"
echo "================================"
echo ""
echo "This script will:"
echo "1. Check if Firebase emulators are running"
echo "2. Run the chat test suite"
echo ""
echo "Make sure you have:"
echo "- Firebase emulators running: firebase emulators:start"
echo "- The chat function deployed to emulator"
echo ""

# Check if emulators are running
if ! curl -s http://localhost:4000 > /dev/null 2>&1; then
  echo "⚠️  Warning: Firebase emulator UI not accessible at http://localhost:4000"
  echo "   Make sure emulators are running: firebase emulators:start"
  echo ""
fi

# Check if chat function is accessible
CHAT_URL="http://localhost:5001/askmwm/us-east1/chat"
if ! curl -s -X POST "$CHAT_URL" -H "Content-Type: application/json" -d '{"messages":[]}' > /dev/null 2>&1; then
  echo "⚠️  Warning: Chat function not accessible at $CHAT_URL"
  echo "   Make sure emulators are running and function is deployed"
  echo ""
fi

echo "Running test suite..."
echo ""

# Run the test suite
CHAT_URL="$CHAT_URL" tsx tests/chat-test-suite.ts

