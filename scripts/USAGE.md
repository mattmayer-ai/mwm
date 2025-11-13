# Quick Usage Guide

## Important: Run from Root Directory

All deployment scripts must be run from the **root directory** (`/home/mattm/git/mwm`), not from `functions/`.

```bash
# ✅ Correct - from root
cd /home/mattm/git/mwm
npm run watch:deploy

# ❌ Wrong - from functions directory
cd functions
npm run watch:deploy  # This won't work!
```

## Common Commands

### Development
```bash
# Start dev server with hot reload
npm run dev
```

### Deployment
```bash
# Quick deploy (frontend only)
npm run deploy

# Full deploy (functions + hosting)
npm run deploy:full

# Watch and auto-deploy on changes
npm run watch:deploy
```

## Directory Structure

- **Root (`/home/mattm/git/mwm`)**: Frontend code, deployment scripts
- **`functions/`**: Firebase Functions code (separate package.json)

