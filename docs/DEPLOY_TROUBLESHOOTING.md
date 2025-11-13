# Deploy Troubleshooting Guide

## "Site Not Found" Fix

### Step 1: Verify Build Output

```bash
# Build the app
npm run build

# Verify dist/ exists and has content
ls -lh dist/index.html
# Should show a file > 1KB

# Check dist/ structure
ls -la dist/
# Should have: index.html, assets/, etc.
```

**If `dist/` is empty or missing:**
- Check for build errors: `npm run build`
- Verify `vite.config.ts` doesn't override `build.outDir`
- Ensure `package.json` has correct build script

### Step 2: Verify firebase.json

Your `firebase.json` should have:

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      { "source": "/api/**", "function": "api" },
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

**Key points:**
- `"public": "dist"` matches Vite's default output
- `/api/**` rewrite comes BEFORE the catch-all `**`
- Catch-all `**` → `/index.html` enables SPA routing

### Step 3: Deploy in Correct Order

```bash
# 1. Deploy rules first
firebase deploy --only firestore:rules

# 2. Build and deploy functions
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions

# 3. Build web app
npm run build

# 4. Verify dist/ exists
ls -lh dist/index.html

# 5. Deploy hosting
firebase deploy --only hosting
```

### Step 4: Verify Deployment

```bash
# Check hosting status
firebase hosting:sites:list

# View hosting details
firebase hosting:sites:get askmwm
```

## API Endpoint Issues

### Problem: `/api/chat` returns 404 via Hosting

**Check 1: Functions are deployed**
```bash
firebase functions:list
# Should show: api (chat, contact, settings, health, reindex)
```

**Check 2: Rewrite is correct**
Your `firebase.json` should have:
```json
"rewrites": [
  { "source": "/api/**", "function": "api" }
]
```

**Check 3: Function exports match**
In `functions/src/index.ts`:
```typescript
export const api = {
  chat: functions.https.onRequest(chat),
  contact: functions.https.onRequest(contact),
  // ...
};
```

**Test direct function URL:**
```bash
curl -X POST \
  https://us-central1-askmwm.cloudfunctions.net/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
```

If this works but Hosting URL doesn't, the rewrite is the issue.

### Problem: CORS errors

**Fix: Update CORS origins in Functions**

Files to update:
- `functions/src/chat.ts`
- `functions/src/contact.ts`
- `functions/src/settings.ts`

Set:
```typescript
const allowedOrigins = [
  'https://askmwm.web.app',
  'https://askmwm.firebaseapp.com',
  'http://localhost:5173',
];
```

Then redeploy:
```bash
cd functions && npm run build && firebase deploy --only functions
```

## Environment Variables

### Production (.env.local should be minimal)

For production with Hosting rewrites, leave `VITE_API_BASE` **empty**:

```bash
# .env.local (for production)
VITE_API_BASE=
VITE_FIREBASE_PROJECT_ID=askmwm
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=askmwm.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=askmwm.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Why empty?** The app will use relative paths `/api/chat` which get rewritten by Hosting to your Functions.

### Local Development

For local dev with emulator:
```bash
# .env.local (for local dev)
VITE_API_BASE=http://localhost:5001/askmwm/us-central1
# ... rest of Firebase config
```

Or rely on Vite proxy in `vite.config.ts` (already configured).

## Quick Verification Commands

### 1. Health Check
```bash
curl -s https://askmwm.web.app/api/health | jq .
```

Expected: `{"status":"healthy",...}`

### 2. Chat Test
```bash
curl -s -X POST \
  https://askmwm.web.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}' \
  | head -20
```

Expected: SSE stream with chunks, ending with `{"type":"done","citations":[...],"tone":"professional"}`

### 3. Frontend Routes
- `https://askmwm.web.app/` → Chat home
- `https://askmwm.web.app/about` → About page
- `https://askmwm.web.app/contact` → Contact form
- `https://askmwm.web.app/projects` → Projects directory

All should render (not 404) because of the SPA rewrite.

### 4. Admin Panel
- Open admin panel (Settings icon)
- Toggle Personal Mode
- Should work if authenticated, 401 if not

## Common Issues & Fixes

### Issue: "Site Not Found" persists

**Fix:**
```bash
# 1. Clean build
rm -rf dist
npm run build

# 2. Verify dist/index.html exists
ls -lh dist/index.html

# 3. Deploy hosting
firebase deploy --only hosting

# 4. Wait 30-60 seconds for propagation
```

### Issue: Functions work directly but not via Hosting

**Fix:** Check rewrite order in `firebase.json`:
```json
"rewrites": [
  { "source": "/api/**", "function": "api" },  // Must come first
  { "source": "**", "destination": "/index.html" }
]
```

Then:
```bash
firebase deploy --only hosting
```

### Issue: SPA routes 404

**Fix:** Ensure catch-all rewrite exists:
```json
{ "source": "**", "destination": "/index.html" }
```

This must be the LAST rewrite rule.

### Issue: Build fails

**Check:**
```bash
# TypeScript errors
npm run typecheck

# Lint errors
npm run lint

# Build with verbose output
npm run build -- --debug
```

## Deployment Checklist

Before deploying:
- [ ] `npm run build` succeeds
- [ ] `dist/index.html` exists and is > 1KB
- [ ] `firebase.json` rewrites are correct
- [ ] CORS origins include your Hosting URLs
- [ ] `VITE_API_BASE` is empty (for prod)
- [ ] Secrets/config set: `ANTHROPIC_API_KEY`, `admin.email`

Deploy order:
- [ ] `firebase deploy --only firestore:rules`
- [ ] `firebase deploy --only functions`
- [ ] `firebase deploy --only hosting`

After deploy:
- [ ] Health check: `curl https://askmwm.web.app/api/health`
- [ ] Chat test: `curl -X POST https://askmwm.web.app/api/chat ...`
- [ ] Frontend routes load (/, /about, /contact, /projects)
- [ ] Admin panel accessible and functional

