import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Admin is initialized in index.ts

const db = admin.firestore();

/**
 * POST /api/reindex
 * Admin-only endpoint to trigger content ingestion
 */
export const reindex = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Secret');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Authorization check
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminSecret = process.env.ADMIN_SECRET || req.headers['x-admin-secret'];

  let isAuthorized = false;

  // Check Firebase Auth token
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      if (decodedToken.email === adminEmail) {
        isAuthorized = true;
      }
    }
  } catch (error) {
    // Auth check failed, continue to secret check
  }

  // Check admin secret
  if (!isAuthorized && adminSecret && adminSecret === process.env.ADMIN_SECRET) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    res.status(403).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // Run ingestion script
    const { stderr } = await execAsync('npm run ingest', {
      cwd: process.cwd(),
      env: {
        ...process.env,
        VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
        VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        VITE_FIREBASE_PROJECT_ID: process.env.GCLOUD_PROJECT,
        VITE_FIREBASE_STORAGE_BUCKET: process.env.GCLOUD_PROJECT + '.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
      },
    });

    if (stderr) {
      console.error('Ingestion stderr:', stderr);
    }

    // Get updated metadata
    const metaDoc = await db.collection('meta').doc('index').get();
    const meta = metaDoc.data();

    res.status(200).json({
      success: true,
      message: 'Reindexing completed',
      lastIndexedAt: meta?.lastIndexedAt,
      chunkCount: meta?.chunkCount,
      sourceCount: meta?.sourceCount,
    });
  } catch (error) {
    console.error('Reindex error:', error);
    res.status(500).json({
      error: 'Reindexing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

