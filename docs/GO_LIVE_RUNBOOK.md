# Go-Live Runbook

## Pre-Deployment Checklist

### 1. Fill Placeholders

**Update CORS origins:**
- `functions/src/chat.ts` (line 29-34)
- `functions/src/contact.ts` (line 12-17)
  - Replace `<your-project>` with your actual Firebase project ID

**Update robots.txt:**
- `public/robots.txt` (line 8)
  - Replace `<your-project>` with your actual Firebase project ID

**Set SITE_URL for sitemap:**
- Will be set as environment variable during build

### 2. Set Secrets & Config

```bash
# Set Anthropic API key
firebase functions:secrets:set ANTHROPIC_API_KEY

# Set admin email
firebase functions:config:set admin.email="you@domain.com"
```

### 3. Generate Sitemap & Deploy

```bash
# Set your site URL
export SITE_URL="https://<your-project>.web.app"

# Generate sitemap
npm run build:sitemap

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Build and deploy Functions
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions

# Build and deploy Hosting
npm run build
firebase deploy --only hosting
```

### 4. Production Smoke Tests (5 minutes)

#### A. API Test (curl)

```bash
curl -s -X POST \
  "https://us-central1-<PROJECT_ID>.cloudfunctions.net/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Give me a 3-bullet overview of your AI work."}]}'
```

**Expected:**
- SSE stream with chunks
- Final `done` event with `citations` array and `tone: "professional"`
- Response time < 6s

#### B. Manual Chat Tests (Phone)

**Test 1: Professional Tone**
- Q: "What's your recent AI focus?"
- Expected: Professional tone badge, 2-4 citations, structured bullets

**Test 2: Narrative Tone**
- Q: "Tell me the story behind your pilot training work."
- Expected: Narrative tone badge, citations, story format

**Test 3: Rate Limiting**
- Send 35+ requests in 1 minute
- Expected: 429 error on request 31+

#### C. Admin Panel Tests

1. **Authentication**
   - Sign in with Firebase Auth
   - Open admin panel (Settings icon)
   - Verify you can see lastIndexedAt and metrics

2. **Personal Mode Toggle**
   - Toggle ON → Verify Firestore `meta/settings` updates
   - Toggle OFF → Verify reverts
   - Test without auth → Should get 401

3. **Metrics Display**
   - After some chat usage, verify metrics show:
     - p50/p95 latency (with color alerts if thresholds exceeded)
     - Retrieval hit rate (red if < 80%)
     - Avg citations
     - Total chats

#### D. Contact Form Test

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

#### E. Page Tests

- `/about`: View source → verify JSON-LD scripts present
- `/contact`: Submit form → check Firestore `leads` collection
- Trust dialog: Verify `lastIndexedAt` displays correctly
- Dark mode: Toggle and verify pages switch themes
- 404 page: Navigate to `/nonexistent` → see friendly 404

### 5. Search/OG Validation

1. **Google Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Test your `/about` page URL
   - Should show Person and CreativeWork schemas

2. **OpenGraph Preview**
   - Test home, about, and one project page
   - Use: https://www.opengraph.xyz/ or Facebook Sharing Debugger

3. **Sitemap Submission**
   - Google Search Console: Submit sitemap URL
   - Bing Webmaster Tools: Submit sitemap URL

## Post-Launch Monitoring (First Week)

### Daily Checks

- [ ] Check Firebase Functions logs: `firebase functions:log --only api:chat`
- [ ] Review admin metrics dashboard
- [ ] Check for 429 rate limit errors (should be < 1% of traffic)
- [ ] Monitor p95 latency (target: < 6s)
- [ ] Monitor retrieval hit rate (target: ≥ 80%)

### Weekly Tasks

- [ ] Review feedback collection for top misses
- [ ] Add 2-3 golden examples to improve responses
- [ ] Check citation CTR (target: > 20%)
- [ ] Review thumbs-down notes and fix content/retrieval

### Monthly Tasks

- [ ] Reindex after content updates
- [ ] Review and update prompt version if needed
- [ ] Check Google Search Console for indexing issues
- [ ] Review analytics trends

## Rollback Plan

If critical issues occur:

1. **Revert Functions:**
   ```bash
   firebase functions:delete api:chat
   # Redeploy previous version from git history
   ```

2. **Disable Features:**
   - Set `ALLOW_PERSONAL=false` in Firestore `meta/settings`
   - Temporarily disable rate limiting if needed

3. **Emergency Contact:**
   - Monitor error logs: `firebase functions:log --only api:chat`
   - Check Firestore for failed requests
   - Review correlation IDs in logs

## Success Criteria

- ✅ Chat p50 latency ≤ 3s, p95 ≤ 6s
- ✅ Retrieval hit rate ≥ 80%
- ✅ Citation CTR > 20%
- ✅ Thumbs-down rate < 10%
- ✅ Rate limit 429s < 1% of traffic
- ✅ All smoke tests pass
- ✅ JSON-LD validates
- ✅ OG tags render correctly

