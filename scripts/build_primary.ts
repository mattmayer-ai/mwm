#!/usr/bin/env tsx
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import FlexSearch from 'flexsearch';

type DocEntry = {
  id: string;
  title: string;
  url: string;
  text: string;
  topics: string[];
  year?: number;
};

type Chunk = {
  id: string;
  text: string;
  meta: {
    sourceId: string;
    topic: string[];
    year?: number;
  };
};

const cwd = process.cwd();
const contentDir = path.join(cwd, 'content');
const outputDir = path.join(cwd, 'indexes');
const outputFile = path.join(outputDir, 'primary.json');

const CHUNK_SIZE = 1100;
const CHUNK_OVERLAP = 180;

const docSources = [
  { dir: 'projects', url: (slug: string) => `/projects/${slug}` },
  { dir: 'resume', url: () => '/about' },
  { dir: 'teaching', url: () => '/teaching' },
  { dir: 'interviews', url: () => '/about' },
];

function sanitize(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function deriveYear(raw: string): number | undefined {
  const match = raw.match(/(20\d{2}|19\d{2})/);
  return match ? Number.parseInt(match[0], 10) : undefined;
}

function chunkText(text: string): string[] {
  if (!text) return [];
  const chunks: string[] = [];
  let idx = 0;
  while (idx < text.length) {
    const end = Math.min(text.length, idx + CHUNK_SIZE);
    chunks.push(text.slice(idx, end).trim());
    if (end === text.length) break;
    idx = end - CHUNK_OVERLAP;
  }
  return chunks.filter(Boolean);
}

async function readDocs(): Promise<DocEntry[]> {
  const docs: DocEntry[] = [];

  for (const source of docSources) {
    const dirPath = path.join(contentDir, source.dir);
    try {
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
        const raw = await fs.readFile(path.join(dirPath, file), 'utf8');
        const { data, content } = matter(raw);
        const base = path.basename(file, path.extname(file));
        const slug = (data.slug as string) || base;
        const title = (data.title as string) || slug;
        const topics = Array.isArray(data.topics)
          ? data.topics.map(String)
          : (data.topic ? [String(data.topic)] : []);

        const text = sanitize(content);
        if (!text) continue;
        docs.push({
          id: slug,
          title,
          text,
          url: source.url(slug),
          topics: topics.length ? topics : [source.dir],
          year: typeof data.year === 'number' ? data.year : deriveYear(slug),
        });
      }
    } catch (err) {
      console.warn(`Skipping ${dirPath}:`, err);
    }
  }

  // include JSON data folder if present
  try {
    const dataDir = path.join(contentDir, 'data');
    const entries = await fs.readdir(dataDir);
    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;
      const raw = await fs.readFile(path.join(dataDir, entry), 'utf8');
      const text = sanitize(raw);
      if (!text) continue;
      const id = path.basename(entry, '.json');
      docs.push({
        id,
        title: id.replace(/[_-]/g, ' '),
        text,
        url: '/about',
        topics: ['data'],
        year: deriveYear(id),
      });
    }
  } catch (err) {
    console.warn('Skipping content/data:', err);
  }

  return docs;
}

async function buildPrimary() {
  const docs = await readDocs();
  if (docs.length === 0) {
    throw new Error('No documents found for ingestion');
  }

  // Create chunks from all documents
  const chunks: Chunk[] = docs.flatMap((doc) =>
    chunkText(doc.text).map((chunk, idx) => ({
      id: `${doc.id}#${idx.toString().padStart(3, '0')}`,
      text: chunk,
      meta: {
        sourceId: doc.id,
        topic: doc.topics,
        year: doc.year,
      },
    })),
  );

  // Index chunks instead of full documents for better search precision
  const index = new FlexSearch.Index({
    tokenize: 'forward',
    preset: 'match',
  });

  chunks.forEach((chunk) => {
    const doc = docs.find((d) => d.id === chunk.meta.sourceId);
    const searchableText = doc ? `${doc.title} ${chunk.text}` : chunk.text;
    index.add(chunk.id, searchableText);
  });

  const serialized: Record<string, unknown> = {};
  if (typeof (index as any).export === 'function') {
    (index as any).export((key: string, data: unknown) => {
      serialized[key] = data;
    });
  }

  // Lookup maps chunk IDs to source document metadata
  const lookup = Object.fromEntries(
    chunks.map((chunk) => {
      const doc = docs.find((d) => d.id === chunk.meta.sourceId);
      return [
        chunk.id,
        {
          title: doc?.title || chunk.id,
          url: doc?.url,
          preview: chunk.text.slice(0, 320),
          sourceId: chunk.meta.sourceId,
        },
      ];
    }),
  );

  // Store maps chunk IDs to chunk text
  const store = Object.fromEntries(chunks.map((chunk) => [chunk.id, chunk.text]));

  // Also keep document-level lookup for backwards compatibility
  const docLookup = Object.fromEntries(
    docs.map((doc) => [
      doc.id,
      {
        title: doc.title,
        url: doc.url,
        preview: doc.text.slice(0, 320),
      },
    ]),
  );

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    outputFile,
    JSON.stringify(
      {
        version: 2,
        createdAt: new Date().toISOString(),
        index: serialized,
        lookup,
        store,
        docLookup, // Document-level metadata for reference
        chunks,
      },
      null,
      2,
    ),
  );

  console.log(`primary.json built with ${docs.length} docs and ${chunks.length} chunks → ${path.relative(cwd, outputFile)}`);
}

buildPrimary().catch((err) => {
  console.error('Failed to build primary.json:', err);
  process.exit(1);
});


