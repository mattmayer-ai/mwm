#!/usr/bin/env tsx
import * as admin from 'firebase-admin';
import { portfolioProjects } from '../data/portfolioProjects';

function resolveCredential() {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    try {
      const parsed = JSON.parse(serviceAccount);
      return admin.credential.cert(parsed);
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', err);
      process.exit(1);
    }
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn(
      'No FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS set. Falling back to applicationDefault; ensure gcloud auth application-default login has been run.',
    );
  }

  return admin.credential.applicationDefault();
}

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'askmwm';

  admin.initializeApp({
    credential: resolveCredential(),
    projectId,
  });

  const db = admin.firestore();
  console.log(`Seeding ${portfolioProjects.length} projects into Firestore project "${projectId}"...`);

  for (const project of portfolioProjects) {
    await db.collection('projects').doc(project.slug).set(project, { merge: true });
    console.log(`✔ Upserted ${project.slug}`);
  }

  console.log('All portfolio projects synced.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to seed projects:', err);
  process.exit(1);
});


