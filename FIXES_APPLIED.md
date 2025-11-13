# Fixes Applied

## A) TypeScript/Type Fixes

### 1. Exported `ChunkCandidate` interface
- **File:** `functions/src/retrieval.ts`
- **Change:** Added `export` keyword to `ChunkCandidate` interface
- **Fix:** Resolves "Module declares 'ChunkCandidate' locally, but it is not exported"

### 2. Fixed FlexSearch `.import()` signature
- **File:** `functions/src/retrieval.ts`
- **Changes:**
  - Created `FlexIndexSerialized` type with single-arg `import` method
  - Updated `loadIndex()` to use proper type casting
  - Fixed search results handling (async/await support)
- **Fix:** Resolves "Expected 2 arguments, but got 1" and type conversion errors

### 3. Centralized Admin initialization
- **File:** `functions/src/index.ts`
- **Change:** Moved `admin.initializeApp()` to single location in `index.ts`
- **Removed:** Duplicate initialization from:
  - `functions/src/retrieval.ts`
  - `functions/src/settings.ts`
  - `functions/src/chat.ts`
  - `functions/src/contact.ts`
  - `functions/src/health.ts`
  - `functions/src/reindex.ts`

### 4. Fixed Firestore `.exists()` usage
- **File:** `functions/src/chat.ts`
- **Change:** Changed `settingsDoc.exists()` to `settingsDoc.exists` (property, not method)
- **Fix:** Resolves "This expression is not callable. Type 'Boolean' has no call signatures"

### 5. Fixed Anthropic SDK streaming
- **File:** `functions/src/chat.ts`
- **Change:** Changed `anthropic.messages.create()` to `anthropic.messages.stream()`
- **Added:** Proper type assertions for message roles
- **Fix:** Resolves message role type mismatches

### 6. Fixed scheduled function import
- **File:** `functions/src/index.ts`
- **Change:** Import `firebase-functions/v1` for scheduled functions
- **Fix:** Resolves "Property 'schedule' does not exist" error

### 7. Removed unused variables
- **File:** `functions/src/reindex.ts`
- **Changes:**
  - Removed unused `storage` variable
  - Removed unused `stdout` from execAsync destructuring

## B) Environment Variables

### Removed NODE_ENV from .env
- **Files:** `.env`, `.env.local`
- **Change:** Removed `NODE_ENV=production` line
- **Reason:** Vite sets NODE_ENV internally; setting it in .env causes warnings

## C) Firebase CLI Setup

To set the active project:

```bash
firebase login
firebase projects:list
firebase use --add  # Select "askmwm" and save alias
firebase use askmwm
```

## Build Status

After these fixes:
- ✅ Functions TypeScript compilation should succeed
- ✅ Web app builds successfully
- ✅ No NODE_ENV warnings
- ✅ All admin initialization centralized

## Next Steps

1. **Set Firebase project:**
   ```bash
   firebase use askmwm
   ```

2. **Build functions:**
   ```bash
   cd functions
   npm install
   npm run build
   ```

3. **Deploy:**
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only functions
   firebase deploy --only hosting
   ```

