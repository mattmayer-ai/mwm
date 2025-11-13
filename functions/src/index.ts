import * as functions from 'firebase-functions';
import * as functionsV1 from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Single admin initialization point
if (!admin.apps.length) {
  admin.initializeApp();
}

import { reindex as reindexHandler } from './reindex';
import { chat as chatHandler } from './chat';
import { updateSettings as settingsHandler } from './settings';
import { contact as contactHandler } from './contact';
import { health as healthHandler } from './health';
import { cleanupRateLimits } from './rateLimit';

// Export individual HTTPS functions for Hosting rewrites
export const chat = functions.https.onRequest(chatHandler);
export const settings = functions.https.onRequest(settingsHandler);
export const contact = functions.https.onRequest(contactHandler);
export const health = functions.https.onRequest(healthHandler);
export const reindex = functions.https.onRequest(reindexHandler);

// Scheduled function to cleanup old rate limit entries (daily)

// Using v1 API for scheduled functions
export const cleanupRateLimitsScheduled = functionsV1.pubsub.schedule('every 24 hours')
  .timeZone('UTC')
  .onRun(async () => {
    await cleanupRateLimits();
  });

