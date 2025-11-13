# Quick Start - Get Chat Agent Running

## 90-Second Setup

### 1. Set Firebase Functions Secret
```bash
cd functions
firebase functions:secrets:set ANTHROPIC_API_KEY
# Enter your Anthropic API key when prompted
```

### 2. Update `.env.local`
```bash
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Leave empty for emulator (Vite proxy handles it)
# Or set to deployed Functions URL for production:
# VITE_API_BASE=https://us-central1-your-project.cloudfunctions.net
```

### 3. Ingest Content
```bash
npm run ingest
```

### 4. Run Locally
```bash
# Terminal 1: Start Firebase emulators
firebase emulators:start

# Terminal 2: Start Vite dev server
npm run dev
```

### 5. Test Chat
- Open http://localhost:3000
- Ask: "What's your experience with React?"
- Should see streaming response with citations

## Troubleshooting

**CORS 404 to /api/chat?**
- Check `VITE_FIREBASE_PROJECT_ID` matches your Firebase project ID
- Verify Vite proxy rewrite path in `vite.config.ts`

**Empty answers?**
- Run `npm run ingest` to populate Firestore
- Check Firestore has `chunks` collection
- Check Cloud Storage has `indexes/primary.json`

**401 from /api/reindex?**
- Set `ADMIN_EMAIL` in Functions environment
- Or use `X-Admin-Secret` header

## Smoke Test
```bash
VITE_FIREBASE_PROJECT_ID=your-project pnpm vitest --run tests/chat.smoke.spec.ts
```

