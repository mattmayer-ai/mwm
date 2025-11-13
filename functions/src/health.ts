import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Admin is initialized in index.ts

/**
 * GET /api/health
 * Health check endpoint for uptime monitoring
 */
export const health = functions.https.onRequest(async (req, res) => {
  try {
    // Quick Firestore read to verify DB connectivity
    const metaDoc = await admin.firestore().collection('meta').doc('index').get();
    const hasIndex = metaDoc.exists;

    // Check if we have recent chat events (indicates system is working)
    const recentEvents = await admin.firestore()
      .collection('analytics')
      .where('eventType', '==', 'chat_complete')
      .where('timestamp', '>=', admin.firestore.Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000))
      .limit(1)
      .get();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      hasIndex,
      recentActivity: !recentEvents.empty,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

