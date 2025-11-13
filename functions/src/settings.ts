import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Admin is initialized in index.ts

/**
 * Assert admin authentication
 */
async function assertAdmin(req: functions.https.Request): Promise<admin.auth.DecodedIdToken> {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  
  if (!idToken) {
    throw new Error('UNAUTHENTICATED');
  }

  const decoded = await admin.auth().verifyIdToken(idToken);
  const adminEmail = process.env.ADMIN_EMAIL;
  
  // Check email match or custom claim
  if (decoded.email !== adminEmail && decoded.admin !== true) {
    throw new Error('PERMISSION_DENIED');
  }

  return decoded;
}

/**
 * POST /api/settings
 * Update settings (admin-only)
 */
export const updateSettings = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Admin authentication check
  try {
    await assertAdmin(req);
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    if (error === 'UNAUTHENTICATED' || error === 'PERMISSION_DENIED') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ error: 'Authentication check failed' });
    return;
  }

  try {
    const { allowPersonal } = req.body;

    if (typeof allowPersonal !== 'boolean') {
      res.status(400).json({ error: 'allowPersonal must be a boolean' });
      return;
    }

    await admin.firestore().collection('meta').doc('settings').set({
      allowPersonal,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    res.json({ success: true });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({
      error: 'Settings update failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

