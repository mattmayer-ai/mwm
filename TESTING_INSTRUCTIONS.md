# Chat Function Testing Instructions

## Changes Made

1. **Fixed Intent Router** (`functions/src/chat.ts`)
   - Made router permissive by default
   - Only routes to SmallTalk for very short greetings (≤20 chars)
   - Only routes to Contact for explicit contact requests
   - Everything else goes to RAG (removed OutOfScope early return)

2. **Improved RAG Query Processing** (`functions/src/retrieval.ts`)
   - Added query expansion for common terms (CNS, RAS, philosophy, achievements)
   - Expands acronyms to full terms for better retrieval

3. **Enhanced Prompts** (`functions/src/prompts.ts`)
   - Added specialized guidance for philosophy, achievement, acronym, and project questions
   - Better instructions for answering these question types

4. **Priority Boosting** (`functions/src/chat.ts`)
   - Boosts interview Q&A content for philosophy and achievement questions
   - Prioritizes relevant content sources based on question type

## Local Testing Setup

### Step 1: Start Firebase Emulators

```bash
# In one terminal
firebase emulators:start
```

This will start:
- Functions emulator at `http://localhost:5001`
- Firestore emulator at `http://localhost:8080`
- UI at `http://localhost:4000`

### Step 2: Deploy Functions to Emulator

The functions should automatically be available when emulators start. Verify by checking:
- Functions emulator logs show the `chat` function is loaded
- You can access the function at: `http://localhost:5001/askmwm/us-east1/chat`

### Step 3: Ensure Index is Available

The chat function needs the RAG index. You have two options:

**Option A: Use production index (requires network)**
- The function will try to load from Cloud Storage
- Make sure `indexes/primary.json` is uploaded to `gs://askmwm/indexes/primary.json`

**Option B: Use local index (for offline testing)**
- You may need to configure the emulator to use a local file
- Or mock the storage bucket in the emulator

### Step 4: Run Test Suite

```bash
# Set the chat URL (defaults to localhost emulator)
export CHAT_URL="http://localhost:5001/askmwm/us-east1/chat"

# Run the test suite
npm run test:chat

# Or use the helper script
./scripts/test-chat-local.sh
```

## Test Questions

The test suite includes 15+ questions covering:

- **Philosophy**: "whats your philosophy", "what's your product philosophy"
- **Achievements**: "tell me about matss best acheivement", "what are your biggest wins"
- **CNS**: "what is CNS", "tell me about CNS", "what does CNS stand for"
- **Projects**: "what's your most recent project", "tell me about TakeCost"
- **Leadership**: "how do you lead teams", "what's your leadership style"
- **Experience**: "what did you do at Air Canada", "tell me about RaceRocks"

## Expected Results

After the fixes:
- ✅ All questions should get substantive answers (not refusals)
- ✅ Philosophy questions should reference interview Q&A or leadership philosophy
- ✅ Achievement questions should reference major achievements with metrics
- ✅ CNS questions should explain what CNS is and its significance
- ✅ Responses should be in first-person, specific, and cite sources
- ✅ Small talk still works (greetings get friendly responses)
- ✅ Contact requests still route correctly

## Troubleshooting

**If tests fail:**
1. Check emulator logs for errors
2. Verify the index is accessible
3. Check that AWS credentials are set (for Bedrock calls)
4. Review the test output for specific failure reasons

**If responses are still vague:**
1. Check RAG retrieval logs - are chunks being found?
2. Review the retrieved context - is it relevant?
3. Check prompt construction - are instructions clear?
4. Verify the index contains the expected content

## Next Steps

After testing:
1. Review test results
2. Identify any remaining issues
3. Refine prompts or retrieval logic as needed
4. Re-test and iterate

