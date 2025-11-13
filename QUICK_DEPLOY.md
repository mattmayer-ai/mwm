# Quick Deploy Guide

## Your Configuration

- **Project ID:** `askmwm`
- **Hosting URLs:** `https://askmwm.web.app`, `https://askmwm.firebaseapp.com`
- **Functions:** Single `api` multiplexer (chat, contact, settings, health, reindex)

## Step-by-Step Deploy

### 1. Install Dependencies (if needed)

```bash
npm install
cd functions && npm install && cd ..
```

### 2. Set Secrets & Config (one-time)

```bash
# Set Anthropic API key
firebase functions:secrets:set ANTHROPIC_API_KEY

# Set admin email
firebase functions:config:set admin.email="you@domain.com"
```

### 3. Generate Sitemap

```bash
export SITE_URL="https://askmwm.web.app"
npm run build:sitemap
```

### 4. Build Web App

```bash
npm run build
```

**Verify build:**
```bash
ls -lh dist/index.html
# Should show a file > 1KB
```

### 5. Deploy Everything

```bash
# Deploy rules
firebase deploy --only firestore:rules

# Build and deploy functions
cd functions
npm run build
cd ..
firebase deploy --only functions

# Deploy hosting
firebase deploy --only hosting
```

## Quick Verification

### 1. Health Check
```bash
curl -s https://askmwm.web.app/api/health | jq .
```

### 2. Chat Test
```bash
curl -s -X POST \
  https://askmwm.web.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Give me two bullets on your AI focus."}]}' \
  | head -20
```

### 3. Frontend Routes
- Open: `https://askmwm.web.app/`
- Open: `https://askmwm.web.app/about`
- Open: `https://askmwm.web.app/contact`

All should load (not 404).

## If "Site Not Found" Persists

1. **Verify dist/ exists:**
   ```bash
   ls -lh dist/index.html
   ```

2. **Rebuild:**
   ```bash
   rm -rf dist
   npm run build
   ```

3. **Redeploy hosting:**
   ```bash
   firebase deploy --only hosting
   ```

4. **Wait 30-60 seconds** for propagation

## Your firebase.json is Correct

Your current `firebase.json` has:
- ✅ `"public": "dist"` (matches Vite output)
- ✅ `/api/**` → `api` function rewrite
- ✅ `**` → `/index.html` SPA rewrite
- ✅ Security headers

## CORS Updated

I've updated CORS origins in:
- `functions/src/chat.ts` → `askmwm.web.app`, `askmwm.firebaseapp.com`
- `functions/src/contact.ts` → `askmwm.web.app`, `askmwm.firebaseapp.com`

**Redeploy functions after CORS changes:**
```bash
cd functions && npm run build && firebase deploy --only functions
```

## Environment Variables

For production, your `.env.local` should have:

```bash
# Leave empty for Hosting rewrites
VITE_API_BASE=

# Your Firebase config
VITE_FIREBASE_PROJECT_ID=askmwm
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=askmwm.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=askmwm.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Important:** `VITE_API_BASE` should be **empty** so the app uses relative paths `/api/chat` which get rewritten by Hosting.

