import * as functions from 'firebase-functions';
import { onRequest } from 'firebase-functions/v2/https';
import * as functionsV1 from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

const storageBucket = process.env.STORAGE_BUCKET || 'askmwm';

// Single admin initialization point
if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket,
  });
  console.log(`Admin initialized with bucket: ${storageBucket}`);
}

import { reindex as reindexHandler } from './reindex';
import { chat as chatHandler } from './chat';
import { updateSettings as settingsHandler } from './settings';
import { contact as contactHandler } from './contact';
import { health as healthHandler } from './health';
import { updateIndexDate as updateIndexDateHandler } from './updateIndexDate';
import { cleanupRateLimits } from './rateLimit';
import { awsSelfcheck } from './awsSelfcheck';

// Export individual HTTPS functions for Hosting rewrites
// Chat function uses AWS Bedrock secrets with extended timeout
// Deployed to us-east1 (Google Cloud) for lower latency to AWS us-east-1 (Bedrock)
export const chat = onRequest(
  {
    region: 'us-east1',
    secrets: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
    timeoutSeconds: 120,
  },
  chatHandler
);
export const settings = functions.https.onRequest(settingsHandler);
export const contact = functions.https.onRequest(contactHandler);
export const health = functions.https.onRequest(healthHandler);
export const reindex = functions.https.onRequest(reindexHandler);
export const updateIndexDate = functions.https.onRequest(updateIndexDateHandler);
export { awsSelfcheck };

// Scheduled function to cleanup old rate limit entries (daily)

// Using v1 API for scheduled functions
export const cleanupRateLimitsScheduled = functionsV1.pubsub.schedule('every 24 hours')
  .timeZone('UTC')
  .onRun(async () => {
    await cleanupRateLimits();
  });

