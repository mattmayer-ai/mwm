# Deployment Checklist

## Pre-Deploy Setup (One-Time)

### 1. Firebase Project Configuration
```bash
firebase use askmwm  # Ensure you're on the right project
```

### 2. Functions Secrets & Config
```bash
# Set Anthropic API key (will prompt for value)
firebase functions:secrets:set ANTHROPIC_API_KEY

# Set admin email
firebase functions:config:set admin.email="you@domain.com"
```

### 3. Environment Variables
Create `.env.local` in the root directory:
```bash
VITE_API_BASE=
VITE_FIREBASE_PROJECT_ID=askmwm
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=askmwm.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=askmwm.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=441841060057
VITE_FIREBASE_APP_ID=1:441841060057:web:01b39d16def5d6ce7056c8
```

**Important:** 
- `VITE_API_BASE` should be **empty** for production (uses Hosting rewrites)
- Do NOT put `ANTHROPIC_API_KEY` or other server secrets in `.env.local`

## Deployment Steps

### Step 1: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Step 2: Build & Deploy Functions
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
cd ..
```

### Step 3: Build Web App
```bash
npm run build
```

**Verify build:**
```bash
ls -lh dist/index.html  # Should show a file > 1KB
```

### Step 4: Generate Sitemap (Optional)
```bash
export SITE_URL="https://askmwm.web.app"
npm run build:sitemap
```

### Step 5: Deploy Hosting
```bash
firebase deploy --only hosting
```

## Post-Deploy Verification

### 1. Health Check
```bash
curl -s https://askmwm.web.app/api/health | jq .
```

Expected: `{"status":"healthy",...}`

### 2. Chat Test
```bash
curl -s -X POST https://askmwm.web.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Give me two bullets on your recent AI focus."}]}'
```

Expected: SSE stream with response

### 3. Frontend Routes
- ✅ `https://askmwm.web.app/` (chat home)
- ✅ `https://askmwm.web.app/about` (JSON-LD present)
- ✅ `https://askmwm.web.app/contact` (form submission)
- ✅ `https://askmwm.web.app/projects` (projects directory)

### 4. Admin Panel
- Open admin panel (Settings icon)
- Toggle Personal Mode
- Unauthenticated calls should return 401

## Troubleshooting

### "Site Not Found"
1. Verify `dist/index.html` exists: `ls -lh dist/index.html`
2. Check `firebase.json` rewrites are correct
3. Ensure correct project: `firebase use askmwm`
4. Redeploy hosting: `firebase deploy --only hosting`

### Functions Not Working
1. Check functions are deployed: `firebase functions:list`
2. Verify CORS origins in `functions/src/chat.ts` and `functions/src/contact.ts`
3. Check function logs: `firebase functions:log`

### CORS Errors
Update allowed origins in:
- `functions/src/chat.ts`
- `functions/src/contact.ts`
- `functions/src/settings.ts`

Then redeploy: `firebase deploy --only functions`

## Current Configuration

- **Project ID:** `askmwm`
- **Hosting URLs:** 
  - `https://askmwm.web.app`
  - `https://askmwm.firebaseapp.com`
- **Functions:** Individual exports (chat, settings, contact, health, reindex)
- **Build Output:** `dist/`
- **Runtime:** Node.js 20

