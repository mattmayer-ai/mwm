#!/usr/bin/env tsx
/**
 * Generate static sitemap.xml
 * Run this during build: npm run build:sitemap
 */

import { writeFileSync } from 'fs';
import { buildSitemap } from '../src/lib/sitemap';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (for build-time generation)
if (!admin.apps.length) {
  admin.initializeApp({
    // Use service account or emulator
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

async function main() {
  const baseUrl = process.env.SITE_URL || 'https://your-project.web.app';
  
  // Fetch project slugs from Firestore
  let projectSlugs: string[] = [];
  try {
    const snapshot = await admin.firestore().collection('projects').get();
    projectSlugs = snapshot.docs.map((doc) => doc.id);
  } catch (error) {
    console.warn('Could not fetch projects, generating sitemap without them:', error);
  }

  const sitemap = await buildSitemap(baseUrl, projectSlugs);
  
  // Write to public directory
  writeFileSync('./public/sitemap.xml', sitemap, 'utf-8');
  console.log(`✅ Sitemap generated: ${projectSlugs.length} project pages`);
}

main().catch(console.error);

