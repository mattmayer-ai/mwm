# Deployment Scripts

This directory contains scripts for building and deploying the mwm application.

## Quick Reference

```bash
# Development (with hot reload)
npm run dev

# Quick deploy (frontend only)
npm run deploy

# Full deploy (functions + hosting)
npm run deploy:full

# Watch and auto-deploy (rebuilds and deploys on file changes)
npm run watch:deploy
```

## Scripts

### `watch-and-deploy.js`
**Node.js-based watch script (cross-platform)**

Watches the `src/` directory for changes and automatically:
1. Rebuilds the frontend
2. Deploys to Firebase Hosting

**Usage:**
```bash
npm run watch:deploy
```

**Features:**
- Debounced (waits 1 second after last change)
- Cross-platform (works on macOS, Linux, Windows)
- Uses `chokidar` (already installed via tailwindcss)

### `quick-deploy.sh`
**Quick deploy script (frontend only)**

Builds and deploys only the frontend to Firebase Hosting.

**Usage:**
```bash
npm run deploy
# or
bash scripts/quick-deploy.sh
```

### `full-deploy.sh`
**Full deploy script (functions + hosting)**

Builds both frontend and functions, then deploys everything.

**Usage:**
```bash
npm run deploy:full
# or
bash scripts/full-deploy.sh
```

### `dev-watch.sh`
**Development watch script**

Runs the Vite dev server with hot module replacement.

**Usage:**
```bash
bash scripts/dev-watch.sh
# or just use: npm run dev
```

## Notes

- The watch script uses `chokidar` which is already installed as a dependency of `tailwindcss`
- All scripts are executable (`chmod +x`)
- The watch script debounces changes to avoid multiple deploys for rapid file saves
- Make sure you're logged into Firebase CLI: `firebase login`
- Make sure the correct project is active: `firebase use askmwm`

