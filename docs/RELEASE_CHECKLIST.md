# Release Checklist

## Pre-Deployment

### 1. Set Firebase Secrets
```bash
# Set Anthropic API key
firebase functions:secrets:set ANTHROPIC_API_KEY

# Set admin email
firebase functions:config:set admin.email="your-email@example.com"
```

### 2. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 3. Build and Deploy Functions
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### 4. Build and Deploy Hosting
```bash
npm run build
firebase deploy --only hosting
```

## Post-Deployment Testing

### 1. Smoke Tests
Run the test suite against production:
```bash
# Temporarily set VITE_API_BASE to production URL
export VITE_API_BASE="https://your-project.cloudfunctions.net"
npm test
```

### 2. Manual Testing
- [ ] Open site on mobile device
- [ ] Test professional question: "What is your AI focus?"
- [ ] Test narrative trigger: "Tell me the story behind..."
- [ ] Verify tone badges appear correctly
- [ ] Verify citations are clickable
- [ ] Test feedback buttons (thumbs up/down)
- [ ] Test admin panel (reindex, personal mode toggle)

### 3. Admin Panel Verification
- [ ] Open admin panel (Settings icon)
- [ ] Verify lastIndexedAt displays
- [ ] Toggle personal mode on/off
- [ ] Check metrics display (after some chat usage)

## Monitoring

### Check Logs
```bash
firebase functions:log --only api:chat
```

### Key Metrics to Watch
- p50/p95 latency (target: p50 ≤ 3s, p95 ≤ 6s)
- Retrieval hit rate (target: ≥80% with citations)
- Error rate
- Citation count per answer

## Rollback Plan

If issues occur:
1. Revert to previous function version:
   ```bash
   firebase functions:delete api:chat
   # Redeploy previous version
   ```
2. Or disable functions temporarily:
   ```bash
   firebase functions:config:set maintenance.enabled=true
   ```

## Future Enhancements

- [ ] Rate limiting per IP (30/min, 200/day)
- [ ] Golden examples integration for few-shot learning
- [ ] Enhanced error handling with user-friendly messages
- [ ] Analytics dashboard with charts

