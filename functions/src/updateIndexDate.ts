import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Admin is initialized in index.ts

/**
 * POST /api/updateIndexDate
 * Updates the lastIndexedAt timestamp in Firestore meta/index
 * Requires admin authentication or secret header
 */
export const updateIndexDate = functions.https.onRequest(async (req, res) => {
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

  try {
    // Update index metadata with current date
    const metaRef = admin.firestore().collection('meta').doc('index');
    const now = admin.firestore.Timestamp.now();
    
    await metaRef.set({
      lastIndexedAt: now,
      updatedAt: now,
    }, { merge: true });

    res.status(200).json({
      success: true,
      lastIndexedAt: now.toDate().toISOString(),
      message: 'Index date updated successfully',
    });
  } catch (error) {
    console.error('Failed to update index date:', error);
    res.status(500).json({
      error: 'Failed to update index date',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

