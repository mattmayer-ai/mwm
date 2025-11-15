#!/usr/bin/env tsx
/**
 * Content ingestion pipeline
 * Parses MDX/Markdown files and PDF resume, chunks content, and builds lexical index
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import pdfParse from 'pdf-parse';
import { Index } from 'flexsearch';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadString } from 'firebase/storage';
import type { EmbeddingChunk, SourceDoc } from '../src/lib/types';

// Firebase config (will be loaded from env)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Configuration
const CHUNK_SIZE_TOKENS = 800; // Target chunk size
const CHUNK_OVERLAP_PERCENT = 12; // 12% overlap between chunks
const TOKENS_PER_CHAR = 0.25; // Rough estimate: 4 chars per token

interface ChunkMetadata {
  docId: string;
  sectionId: string;
  title: string;
  sourceUrl: string;
  chunkIndex: number;
  totalChunks: number;
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length * TOKENS_PER_CHAR);
}

/**
 * Split text into chunks with overlap
 */
function chunkText(
  text: string,
  docId: string,
  sectionId: string,
  title: string,
  sourceUrl: string
): Array<{ text: string; metadata: ChunkMetadata }> {
  const chunks: Array<{ text: string; metadata: ChunkMetadata }> = [];
  const targetChars = Math.floor(CHUNK_SIZE_TOKENS / TOKENS_PER_CHAR);
  const overlapChars = Math.floor(targetChars * (CHUNK_OVERLAP_PERCENT / 100));

  let start = 0;
  let chunkIndex = 0;

  while (start < text.length) {
    const end = Math.min(start + targetChars, text.length);
    const chunkText = text.slice(start, end).trim();

    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        metadata: {
          docId,
          sectionId,
          title,
          sourceUrl,
          chunkIndex,
          totalChunks: 0, // Will be set after all chunks are created
        },
      });
      chunkIndex++;
    }

    // Move start position with overlap
    start = end - overlapChars;
    if (start >= text.length) break;
  }

  // Update totalChunks for all chunks
  chunks.forEach((chunk) => {
    chunk.metadata.totalChunks = chunks.length;
  });

  return chunks;
}

/**
 * Parse MDX/Markdown file
 */
async function parseMarkdownFile(filePath: string): Promise<{
  frontmatter: Record<string, unknown>;
  content: string;
  html: string;
}> {
  const content = await readFile(filePath, 'utf-8');
  const { data, content: body } = matter(content);
  const processed = await remark().use(html).process(body);
  const htmlContent = processed.toString();

  return {
    frontmatter: data,
    content: body,
    html: htmlContent,
  };
}

/**
 * Parse PDF file
 */
async function parsePdfFile(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

/**
 * Sectionize content based on markdown headers
 */
function sectionizeContent(content: string, docId: string, baseUrl: string): Array<{
  id: string;
  type: string;
  title: string;
  text: string;
  sourceUrl: string;
}> {
  const sections: Array<{ id: string; type: string; title: string; text: string; sourceUrl: string }> = [];
  
  // Split by markdown headers (## or ###)
  const headerRegex = /^(#{2,3})\s+(.+)$/gm;
  const lines = content.split('\n');
  
  let currentSection: { id: string; type: string; title: string; lines: string[] } | null = null;
  let sectionIndex = 0;

  // Add intro section if content starts without header
  if (lines.length > 0 && !lines[0].match(/^#/)) {
    currentSection = {
      id: 'intro',
      type: 'context',
      title: 'Introduction',
      lines: [],
    };
  }

  for (const line of lines) {
    const headerMatch = line.match(headerRegex);
    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        sections.push({
          id: currentSection.id,
          type: currentSection.type,
          title: currentSection.title,
          text: currentSection.lines.join('\n').trim(),
          sourceUrl: `${baseUrl}#${currentSection.id}`,
        });
      }

      // Start new section
      const level = headerMatch[1].length;
      const title = headerMatch[2].trim();
      const type = inferSectionType(title);
      sectionIndex++;
      
      currentSection = {
        id: `section-${sectionIndex}`,
        type,
        title,
        lines: [],
      };
    } else if (currentSection) {
      currentSection.lines.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections.push({
      id: currentSection.id,
      type: currentSection.type,
      title: currentSection.title,
      text: currentSection.lines.join('\n').trim(),
      sourceUrl: `${baseUrl}#${currentSection.id}`,
    });
  }

  // If no sections found, treat entire content as one section
  if (sections.length === 0) {
    sections.push({
      id: 'content',
      type: 'context',
      title: 'Content',
      text: content.trim(),
      sourceUrl: baseUrl,
    });
  }

  return sections;
}

/**
 * Infer section type from title
 */
function inferSectionType(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('context') || lower.includes('problem') || lower.includes('background')) return 'context';
  if (lower.includes('constraint')) return 'constraints';
  if (lower.includes('process') || lower.includes('approach') || lower.includes('method')) return 'process';
  if (lower.includes('decision')) return 'decisions';
  if (lower.includes('outcome') || lower.includes('result') || lower.includes('metric')) return 'outcomes';
  if (lower.includes('artifact') || lower.includes('code') || lower.includes('demo')) return 'artifacts';
  if (lower.includes('learning') || lower.includes('takeaway')) return 'learnings';
  return 'context';
}

/**
 * Extract outcomes/metrics from content and frontmatter
 */
function extractOutcomes(content: string, frontmatter: Record<string, unknown>): Array<{
  metric: string;
  baseline?: string;
  result?: string;
  delta?: string;
}> {
  const outcomes: Array<{ metric: string; baseline?: string; result?: string; delta?: string }> = [];
  
  // Extract from frontmatter if present
  if (frontmatter.impact && Array.isArray(frontmatter.impact)) {
    for (const item of frontmatter.impact) {
      if (typeof item === 'object' && item !== null) {
        outcomes.push({
          metric: (item as { label?: string; metric?: string }).label || (item as { label?: string; metric?: string }).metric || '',
          baseline: (item as { before?: string }).before,
          result: (item as { after?: string }).after,
          delta: (item as { delta?: string }).delta,
        });
      }
    }
  }
  
  // Try to extract from content (look for patterns like "+18% retention")
  const metricRegex = /([+\-]?\d+%?)\s+(\w+)/gi;
  const matches = content.matchAll(metricRegex);
  for (const match of matches) {
    if (match[1] && match[2]) {
      outcomes.push({
        metric: match[2],
        delta: match[1],
      });
    }
  }
  
  return outcomes;
}

/**
 * Process content directory
 */
async function processContentDirectory(contentDir: string): Promise<{
  chunks: Array<EmbeddingChunk & { id: string }>;
  sourceDocs: SourceDoc[];
}> {
  const chunks: Array<EmbeddingChunk & { id: string }> = [];
  const sourceDocs: SourceDoc[] = [];
  const projectsDir = join(contentDir, 'projects');
  const resumeDir = join(contentDir, 'resume');

  // Process project files
  try {
    const projectFiles = await readdir(projectsDir);
    for (const file of projectFiles) {
      if (extname(file) === '.mdx' || extname(file) === '.md') {
        const filePath = join(projectsDir, file);
        const stats = await stat(filePath);
        const { frontmatter, content, html: htmlContent } = await parseMarkdownFile(filePath);
        
        const slug = frontmatter.slug as string || basename(file, extname(file));
        const title = (frontmatter.title as string) || slug;
        const docId = `project-${slug}`;
        const sourceUrl = `/projects/${slug}`;

        sourceDocs.push({
          id: docId,
          type: 'mdx',
          url: sourceUrl,
          title,
          updatedAt: stats.mtime.toISOString(),
        });

        // Sectionize and chunk
        const sections = sectionizeContent(content, docId, sourceUrl);
        for (const section of sections) {
          const sectionChunks = chunkText(section.text, docId, section.id, title, section.sourceUrl);
          for (const chunk of sectionChunks) {
            const chunkId = `${docId}-${section.id}-${chunk.metadata.chunkIndex}`;
            chunks.push({
              id: chunkId,
              docId,
              sectionId: section.id,
              text: chunk.text,
              sourceUrl: section.sourceUrl,
              title: `${title} — ${section.title}`,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }
  } catch (error) {
    console.warn('Projects directory not found or empty:', error);
  }

  // Process resume
  try {
    const resumeFiles = await readdir(resumeDir);
    for (const file of resumeFiles) {
      if (extname(file) === '.md' || extname(file) === '.mdx') {
        const filePath = join(resumeDir, file);
        const stats = await stat(filePath);
        const { frontmatter, content } = await parseMarkdownFile(filePath);
        
        const docId = 'resume';
        const title = (frontmatter.title as string) || 'Resume';
        const sourceUrl = '/about';

        sourceDocs.push({
          id: docId,
          type: 'mdx',
          url: sourceUrl,
          title,
          updatedAt: stats.mtime.toISOString(),
        });

        const sections = sectionizeContent(content, docId, sourceUrl);
        for (const section of sections) {
          const sectionChunks = chunkText(section.text, docId, section.id, title, section.sourceUrl);
          for (const chunk of sectionChunks) {
            const chunkId = `${docId}-${section.id}-${chunk.metadata.chunkIndex}`;
            chunks.push({
              id: chunkId,
              docId,
              sectionId: section.id,
              text: chunk.text,
              sourceUrl: section.sourceUrl,
              title: `${title} — ${section.title}`,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }
  } catch (error) {
    console.warn('Resume directory not found or empty:', error);
  }

  // Process PDF resume if exists
  try {
    const pdfPath = join(process.cwd(), 'public', 'resume', 'mwm-resume.pdf');
    const stats = await stat(pdfPath);
    const text = await parsePdfFile(pdfPath);
    
    const docId = 'resume-pdf';
    const title = 'Resume (PDF)';
    const sourceUrl = '/about';

    sourceDocs.push({
      id: docId,
      type: 'pdf',
      url: sourceUrl,
      title,
      updatedAt: stats.mtime.toISOString(),
    });

    const sections = sectionizeContent(text, docId, sourceUrl);
    for (const section of sections) {
      const sectionChunks = chunkText(section.text, docId, section.id, title, section.sourceUrl);
      for (const chunk of sectionChunks) {
        const chunkId = `${docId}-${section.id}-${chunk.metadata.chunkIndex}`;
        chunks.push({
          id: chunkId,
          docId,
          sectionId: section.id,
          text: chunk.text,
          sourceUrl: section.sourceUrl,
          title: `${title} — ${section.title}`,
          createdAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.warn('PDF resume not found:', error);
  }

  return { chunks, sourceDocs };
}

/**
 * Build lexical index using FlexSearch
 */
function buildLexicalIndex(chunks: Array<EmbeddingChunk & { id: string }>): Index {
  const index = new Index({
    tokenize: 'forward',
    cache: 100,
  });

  for (const chunk of chunks) {
    index.add(chunk.id, chunk.text);
  }

  return index;
}

/**
 * Main ingestion function
 */
async function ingest() {
  console.log('Starting content ingestion...');

  const contentDir = join(process.cwd(), 'content');
  
  // Process content
  const { chunks, sourceDocs } = await processContentDirectory(contentDir);
  console.log(`Processed ${chunks.length} chunks from ${sourceDocs.length} source documents`);

  // Write chunks to Firestore
  const chunksRef = collection(db, 'chunks');
  const batch = writeBatch(db);
  let batchCount = 0;

  for (const chunk of chunks) {
    const chunkRef = doc(chunksRef, chunk.id);
    batch.set(chunkRef, {
      docId: chunk.docId,
      sectionId: chunk.sectionId,
      text: chunk.text,
      sourceUrl: chunk.sourceUrl,
      title: chunk.title,
      createdAt: chunk.createdAt,
    });
    batchCount++;

    // Firestore batch limit is 500
    if (batchCount >= 500) {
      await batch.commit();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }
  console.log(`Wrote ${chunks.length} chunks to Firestore`);

  // Write source docs metadata
  const sourcesRef = collection(db, 'sources');
  for (const source of sourceDocs) {
    await setDoc(doc(sourcesRef, source.id), source);
  }
  console.log(`Wrote ${sourceDocs.length} source documents to Firestore`);

  // Write projects and cases metadata
  const projectsRef = collection(db, 'projects');
  const casesRef = collection(db, 'cases');
  
  for (const source of sourceDocs) {
    if (source.type === 'mdx' && source.id.startsWith('project-')) {
      // Try to read the original file to get frontmatter
      try {
        const slug = source.id.replace('project-', '');
        const filePath = join(projectsDir, `${slug}.mdx`);
        const stats = await stat(filePath);
        const { frontmatter } = await parseMarkdownFile(filePath);
        
        // Write project metadata
        await setDoc(doc(projectsRef, slug), {
          slug,
          title: (frontmatter.title as string) || slug,
          year: (frontmatter.year as number) || new Date().getFullYear(),
          role: Array.isArray(frontmatter.role) ? frontmatter.role : [frontmatter.role as string].filter(Boolean),
          industry: Array.isArray(frontmatter.industry) ? frontmatter.industry : [frontmatter.industry as string].filter(Boolean),
          skills: Array.isArray(frontmatter.skills) ? frontmatter.skills : [frontmatter.skills as string].filter(Boolean),
          summary: (frontmatter.summary as string) || '',
          impact: Array.isArray(frontmatter.impact) ? frontmatter.impact : [],
          updatedAt: stats.mtime.getTime(),
        });

        // Write case study sections
        const { content } = await parseMarkdownFile(filePath);
        const sections = sectionizeContent(content, source.id, source.url);
        const outcomes = extractOutcomes(content, frontmatter);
        
        await setDoc(doc(casesRef, slug), {
          projectSlug: slug,
          sections: sections.map((s) => ({
            id: s.id,
            title: s.title,
            body: s.text, // Will be sanitized HTML in production
          })),
          outcomes,
          anchors: sections.map((s) => ({
            sectionId: s.id,
            anchor: `#sec-${s.id}`,
          })),
          updatedAt: stats.mtime.getTime(),
        });
      } catch (error) {
        console.warn(`Failed to process project ${source.id}:`, error);
      }
    }
  }
  
  console.log('Wrote projects and cases metadata to Firestore');

  // Build and persist lexical index
  const index = buildLexicalIndex(chunks);
  const indexData = index.export();
  const indexJson = JSON.stringify(indexData);

  const indexRef = ref(storage, 'indexes/primary.json');
  await uploadString(indexRef, indexJson, 'raw');
  console.log('Persisted lexical index to Cloud Storage');

  // Update index metadata
  const metaRef = doc(db, 'meta', 'index');
  await setDoc(metaRef, {
    version: Date.now(),
    lastIndexedAt: new Date().toISOString(),
    chunkCount: chunks.length,
    sourceCount: sourceDocs.length,
  }, { merge: true });
  console.log('Updated index metadata');

  console.log('Ingestion complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ingest().catch((error) => {
    console.error('Ingestion failed:', error);
    process.exit(1);
  });
}

export { ingest };

