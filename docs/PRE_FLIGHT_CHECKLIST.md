# Pre-Flight Checklist

## 1. Secrets & Configuration (5-10 min)

### Set Firebase Secrets
```bash
# Set Anthropic API key
firebase functions:secrets:set ANTHROPIC_API_KEY

# Set admin email
firebase functions:config:set admin.email="you@domain.com"
```

### Verify Environment Variables
- `ANTHROPIC_API_KEY` - Set via secrets
- `ADMIN_EMAIL` - Set via config
- `VITE_FIREBASE_*` - Set in `.env.local` for local dev

## 2. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

**Verify:**
- Rules allow read for `chunks`, `sources`, `meta`
- Rules allow create for `feedback`, `analytics`
- Rules block client writes to `_rateLimits`, `leads`, `meta/settings`

## 3. Build & Deploy Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

**Verify deployment:**
- `api/chat` - Chat endpoint
- `api/contact` - Contact form endpoint
- `api/settings` - Admin settings endpoint
- `api/reindex` - Content reindexing endpoint
- `cleanupRateLimitsScheduled` - Daily cleanup job

## 4. Build & Deploy Hosting

```bash
npm run build
firebase deploy --only hosting
```

**Verify:**
- Site loads at your Firebase Hosting URL
- API calls proxy correctly via `firebase.json` rewrites

## 5. Production Validation (15 min)

### A. API Test (curl)

```bash
curl -s -X POST \
  "https://us-central1-<PROJECT_ID>.cloudfunctions.net/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Give me a 3-bullet overview of your AI work."}]}'
```

**Expected:**
- SSE stream with chunks
- Final `done` event with `citations` and `tone: "professional"`
- Response time < 6s (p95 target)

### B. Manual Chat Tests (Phone)

**Test 1: Professional Tone**
- Q: "What's your recent AI focus?"
- Expected: Professional tone badge, 2-4 citations, structured bullets

**Test 2: Narrative Tone**
- Q: "Tell me the story behind your pilot training work."
- Expected: Narrative tone badge, citations, story format

**Test 3: Rate Limiting**
- Send 35+ requests in 1 minute
- Expected: 429 error on request 31+

### C. Admin Panel Tests

1. **Authentication**
   - Sign in with Firebase Auth
   - Open admin panel (Settings icon)
   - Verify you can see lastIndexedAt

2. **Personal Mode Toggle**
   - Toggle ON → Verify Firestore `meta/settings` updates
   - Toggle OFF → Verify reverts
   - Test without auth → Should get 401

3. **Metrics Display**
   - After some chat usage, verify metrics show:
     - p50/p95 latency
     - Retrieval hit rate
     - Avg citations
     - Total chats

### D. Contact Form Test

```bash
curl -X POST \
  "https://us-central1-<PROJECT_ID>.cloudfunctions.net/api/contact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "Test message"
  }'
```

**Expected:**
- Success response
- Entry in Firestore `leads` collection
- Rate limiting works (30/min)

## 6. CORS Verification

Verify Functions allow your hosting origin:

```typescript
// In functions/src/chat.ts and contact.ts
const allowedOrigins = [
  'https://your-project.web.app',
  'https://your-project.firebaseapp.com',
  // Add your custom domain if applicable
];
```

## 7. Content Stability Check

- Verify `sectionId`s in case studies are stable (won't change after edits)
- Test citation deep links work: `/projects/slug#sec-sectionId`

## 8. Monitoring Setup

- Check Firebase Functions logs: `firebase functions:log`
- Verify analytics events are being logged to Firestore
- Set up alerts for error rates > 5%

## 9. Security Final Check

- [ ] No API keys in client code
- [ ] Admin endpoints require authentication
- [ ] Rate limiting enabled on chat/contact
- [ ] Firestore rules prevent unauthorized writes
- [ ] CORS configured correctly

## 10. Performance Baseline

- [ ] Chat p50 latency < 3s
- [ ] Chat p95 latency < 6s
- [ ] Retrieval hit rate > 80%
- [ ] Page LCP < 2.5s (desktop)

## Rollback Plan

If issues occur:

1. **Revert Functions:**
   ```bash
   firebase functions:delete api:chat
   # Redeploy previous version
   ```

2. **Disable Features:**
   - Set `ALLOW_PERSONAL=false` in Firestore `meta/settings`
   - Temporarily disable rate limiting if needed

3. **Emergency Contact:**
   - Monitor error logs: `firebase functions:log --only api:chat`
   - Check Firestore for failed requests

## Post-Launch (First Week)

- Monitor error logs daily
- Track citation CTR and feedback
- Watch p95 latency trends
- Reindex after content changes
- Add 2-3 golden examples per week

