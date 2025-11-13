# Chat Agent Setup & Testing Guide

## Quick Start - Get Chat Running

### 1. Verify Environment Variables

Make sure your `.env.local` has:
```bash
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
ANTHROPIC_API_KEY=your_anthropic_key
```

### 2. Set Firebase Functions Environment

In Firebase Functions, set the Anthropic API key:
```bash
cd functions
firebase functions:config:set anthropic.api_key="your_key"
# Or use secrets (recommended):
firebase functions:secrets:set ANTHROPIC_API_KEY
```

### 3. Deploy Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 4. Update API Base URL

For production, update `src/features/chat/api.ts`:
- Set `VITE_API_BASE` in `.env.local` to your deployed Functions URL
- Or use relative path `/api/chat` if using Firebase Hosting rewrites

### 5. Test Chat Locally

**Option A: Using Firebase Emulators**
```bash
# Terminal 1: Start emulators
firebase emulators:start

# Terminal 2: Start Vite dev server
npm run dev
```

**Option B: Using Deployed Functions**
```bash
# Set VITE_API_BASE in .env.local to your Functions URL
VITE_API_BASE=https://us-central1-your-project.cloudfunctions.net

# Start dev server
npm run dev
```

### 6. Test the Chat

1. Open http://localhost:3000
2. Type a question like "What's your experience with React?"
3. Check browser console for any errors
4. Check Firebase Functions logs: `firebase functions:log`

## Troubleshooting

### Chat not responding?
- Check browser console for errors
- Verify `ANTHROPIC_API_KEY` is set in Functions
- Check Functions logs: `firebase functions:log`
- Verify CORS headers are set correctly

### "No response body" error?
- Check that Functions are deployed/running
- Verify API_BASE URL is correct
- Check network tab for actual request URL

### Citations not showing?
- Ensure content has been ingested: `npm run ingest`
- Check Firestore has `chunks` collection
- Verify Cloud Storage has `indexes/primary.json`

## Next Steps

Once chat is working:
1. Add sample content to `/content/projects/` and `/content/resume/`
2. Run `npm run ingest` to index content
3. Test with real questions about your work
4. Customize system prompt further to match your voice

