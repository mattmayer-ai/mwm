#!/usr/bin/env tsx
/**
 * Minimal ingestion script to build the lexical index used for RAG.
 * Reads MDX + JSON content from /content and writes indexes/primary.json locally.
 */

import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import FlexSearch from 'flexsearch';

type DocEntry = {
  id: string;
  title: string;
  url: string;
  text: string;
};

const cwd = process.cwd();
const contentDir = path.join(cwd, 'content');
const projectsDir = path.join(contentDir, 'projects');
const resumeDir = path.join(contentDir, 'resume');
const teachingDir = path.join(contentDir, 'teaching');
const dataDir = path.join(contentDir, 'data');
const outputDir = path.join(cwd, 'indexes');
const outputFile = path.join(outputDir, 'primary.json');

const BOOSTS: Record<string, string[]> = {
  '2024-platform-swift-racks-cns-innovation': [
    'CNS innovation platform',
    'innovation pipeline metrics',
    'cycle time reductions',
    'validation throughput',
    'ARR projections',
    'multi-agent orchestration',
    'knowledge graph agent',
    'TakeCost manager agent',
    'PGVector semantic search',
    'Neo4j graph memory',
  ],
  '2024-strategy-swift-racks-takecost-pivot': [
    'TakeCost strategy',
    'estimating workflow',
    'signal flow',
    'assumption discovery',
    'contractor feedback',
    'pipeline automation',
    'AI estimator throughput',
    'consensus agent voting',
  ],
  '2025-pivot-swift-racks-edpal-ai': [
    'EdPal AI assistant',
    'education platform pivot',
    'AI guardrails',
    'course builder',
    'agent orchestration',
  ],
  '2019-pm-racerocks-ras-simulator': [
    'Replenishment At Sea simulator',
    'RAS physics fidelity',
    'Royal Canadian Navy training',
    'Unity + Unreal simulation',
    'ship handling model',
    'acceptance testing',
  ],
  content_teaching_schulich: [
    'Schulich School of Business',
    'product management course',
    'AI guardrails workshop',
    'responsible AI assignment',
    'business constraints simulation',
  ],
  content_resume_resume: [
    'resume summary',
    'career highlights',
    'leadership summary',
    'tenure timeline',
  ],
  matt_mayer_master_career_document: [
    'staff product manager hiring rubric',
    'hiring loop exercises',
    'Boeing VR failure',
    'Kotter change management',
    'technology timing framework',
  ],
  matt_mayer_enhanced_compilation: [
    'canonical profile',
    'Swift Racks ARR',
    'leadership overview',
    'CPO-ready summary',
  ],
  matt_mayer_rag_indexed: [
    'RAG reference',
    'CNS agent glossary',
    'TakeCost insights',
    'knowledge graph details',
  ],
  matt_mayer_technical_projects_deepdive: [
    'TakeCost architecture',
    'knowledge graph agent implementation',
    'multi-agent orchestration',
    'signal flow diagrams',
    'AWS Bedrock Claude Sonnet 3.7',
  ],
  matt_mayer_qa_reference: [
    'common interview questions',
    'portfolio QA',
    'leadership prompts',
    'metrics storytelling',
  ],
  '2012-pm-air-canada-offline-training': [
    'Air Canada offline iPad training',
    'pilot training platform',
    'regulatory compliance',
    'journey mapping',
  ],
};

function sanitizeText(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

async function readMdxFile(filePath: string, urlBuilder: (slug: string) => string): Promise<DocEntry | null> {
  const raw = await fs.readFile(filePath, 'utf8');
  const { data, content } = matter(raw);
  const base = path.basename(filePath, path.extname(filePath));
  const slug = (data.slug as string) || base;
  const title = (data.title as string) || slug;
  const text = sanitizeText(content);
  if (!text) return null;
  return {
    id: slug,
    title,
    url: urlBuilder(slug),
    text,
  };
}

async function readJsonFile(filePath: string, id: string, title: string, url: string): Promise<DocEntry | null> {
  const raw = await fs.readFile(filePath, 'utf8');
  const text = sanitizeText(raw);
  if (!text) return null;
  return { id, title, url, text };
}

function applyBoost(doc: DocEntry): DocEntry {
  const boosts = BOOSTS[doc.id];
  if (boosts?.length) {
    doc.text = `${doc.text} ${boosts.join(' ')}`;
  }
  return doc;
}

async function collectDocs(): Promise<DocEntry[]> {
  const docs: DocEntry[] = [];

  async function pushFromDir(dir: string, urlBuilder: (slug: string) => string) {
    try {
      const entries = await fs.readdir(dir);
      for (const entry of entries) {
        if (!entry.endsWith('.mdx') && !entry.endsWith('.md')) continue;
        const doc = await readMdxFile(path.join(dir, entry), urlBuilder);
        if (doc) docs.push(applyBoost(doc));
      }
    } catch (err) {
      console.warn(`Skipping ${dir}:`, err);
    }
  }

  await pushFromDir(projectsDir, (slug) => `/projects/${slug}`);
  await pushFromDir(resumeDir, () => '/about');
  await pushFromDir(teachingDir, () => '/teaching');

  // JSON data sources
  const dataFiles = [
    { file: 'data_skills_matrix.json', id: 'skills', title: 'Skills Matrix', url: '/about' },
    { file: 'data_timeline.json', id: 'timeline', title: 'Career Timeline', url: '/about' },
    { file: 'data_golden_examples.json', id: 'golden', title: 'Golden Examples', url: '/projects' },
  ];

  for (const info of dataFiles) {
    try {
      const doc = await readJsonFile(path.join(dataDir, info.file), info.id, info.title, info.url);
      if (doc) docs.push(applyBoost(doc));
    } catch (err) {
      console.warn(`Skipping ${info.file}:`, err);
    }
  }

  return docs;
}

async function buildIndex() {
  const docs = await collectDocs();
  if (docs.length === 0) {
    console.warn('No documents found to index.');
    return;
  }

  const index = new FlexSearch.Index({
    tokenize: 'forward',
    preset: 'match',
  });

  docs.forEach((doc) => index.add(doc.id, `${doc.title} ${doc.text}`));

  const serialized: Record<string, unknown> = {};
  if (typeof (index as any).export === 'function') {
    (index as any).export((key: string, data: unknown) => {
      serialized[key] = data;
    });
  }

  await fs.mkdir(outputDir, { recursive: true });
  const lookupEntries = Object.fromEntries(
    docs.map((doc) => [
      doc.id,
      {
        title: doc.title,
        url: doc.url,
        preview: doc.text.slice(0, 280),
      },
    ])
  );

  const storeEntries = Object.fromEntries(
    docs.map((doc) => [
      doc.id,
      doc.text,
    ])
  );

  await fs.writeFile(
    outputFile,
    JSON.stringify(
      {
        version: 1,
        createdAt: new Date().toISOString(),
        index: serialized,
        lookup: lookupEntries,
        store: storeEntries,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`Indexed ${docs.length} documents → ${path.relative(cwd, outputFile)}`);
}

buildIndex().catch((err) => {
  console.error('Failed to build index:', err);
  process.exit(1);
});


