#!/usr/bin/env node

/**
 * Watch and auto-deploy script using Node.js (cross-platform)
 * Watches for file changes and automatically rebuilds and deploys
 * 
 * Usage: npm run watch:deploy
 * Or: node scripts/watch-and-deploy.js
 */

const { execSync } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function build() {
  try {
    log('📦 Building frontend...', 'blue');
    execSync('npm run build', { stdio: 'inherit' });
    log('✅ Frontend build successful', 'green');
    return true;
  } catch (error) {
    log('❌ Build failed', 'red');
    return false;
  }
}

function deploy() {
  try {
    log('🚀 Deploying to Firebase Hosting...', 'blue');
    execSync('firebase deploy --only hosting', { stdio: 'inherit' });
    log('✅ Deployment successful!', 'green');
    log('🌐 Site: https://askmwm.web.app', 'blue');
    return true;
  } catch (error) {
    log('❌ Deployment failed', 'red');
    return false;
  }
}

function deployFull() {
  if (!build()) return false;
  return deploy();
}

// Initial deploy
log('🚀 Starting watch and deploy mode...', 'blue');
log('Press Ctrl+C to stop\n', 'yellow');
deployFull();

// Watch for changes
const srcPath = path.join(__dirname, '..', 'src');
let debounceTimer;

log(`👀 Watching for changes in ${srcPath}...`, 'blue');

const watcher = chokidar.watch(srcPath, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true,
});

watcher.on('change', (filePath) => {
  log(`\n🔄 Change detected: ${path.relative(process.cwd(), filePath)}`, 'yellow');
  
  // Debounce: wait 1 second after last change
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    log('📦 Rebuilding and deploying...', 'blue');
    deployFull();
    log('\n👀 Watching for changes...', 'blue');
  }, 1000);
});

watcher.on('error', (error) => {
  log(`❌ Watcher error: ${error}`, 'red');
});

process.on('SIGINT', () => {
  log('\n\n👋 Stopping watcher...', 'yellow');
  watcher.close();
  process.exit(0);
});

