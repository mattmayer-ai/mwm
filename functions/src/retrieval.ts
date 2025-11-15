import * as admin from 'firebase-admin';

export type ChunkCandidate = {
  docId: string;
  score: number;
  sourceTitle: string;
  url?: string;
  snippet: string;
};

type LookupEntry = {
  title: string;
  url?: string;
};

type StoreEntry = Record<string, string>;

type CachedIndex = {
  index: any;
  lookup: Record<string, LookupEntry>;
  store?: StoreEntry;
};

let cache: CachedIndex | null = null;

function getFlexIndex(): any {
  const FlexSearch = require('flexsearch');
  return new (FlexSearch.Index ?? FlexSearch)({
    tokenize: 'forward',
    preset: 'match',
  });
}

function importSerializedIndex(idx: any, serialized: unknown) {
  if (!serialized || typeof idx.import !== 'function') {
    return;
  }

  if (typeof serialized === 'string') {
    idx.import(serialized);
    return;
  }

  if (typeof serialized === 'object') {
    const entries = Object.entries(serialized as Record<string, unknown>);
    for (const [key, value] of entries) {
      idx.import(key, value);
    }
  }
}

function buildSnippet(text: string, query: string, maxLen = 240): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';

  const normalizedQuery = query.toLowerCase();
  const index = clean.toLowerCase().indexOf(normalizedQuery);

  if (index === -1) {
    return clean.length > maxLen ? `${clean.slice(0, maxLen)}…` : clean;
  }

  const start = Math.max(0, index - Math.floor(maxLen / 3));
  const end = Math.min(clean.length, start + maxLen);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < clean.length ? '…' : '';

  return `${prefix}${clean.slice(start, end)}${suffix}`;
}

async function loadIndex(): Promise<CachedIndex | null> {
  if (cache) {
    return cache;
  }

  const bucketName = process.env.STORAGE_BUCKET || (admin.app().options.storageBucket as string) || 'askmwm';
  console.log('RAG load start', { bucketName, path: 'indexes/primary.json' });

  try {
    const [buffer] = await admin.storage().bucket(bucketName).file('indexes/primary.json').download();
    console.log('RAG load done', { bytes: buffer.length });

    const data = JSON.parse(buffer.toString('utf8')) as {
      index: unknown;
      lookup?: Record<string, LookupEntry>;
      store?: StoreEntry;
    };

    const idx = getFlexIndex();
    if (data.index) {
      importSerializedIndex(idx, data.index);
      console.log('RAG index imported', {
        hasSerializedIndex: true,
        hasLookup: Boolean(data.lookup),
        hasStore: Boolean(data.store),
      });
    } else if (data.store) {
      console.log('RAG index missing serialized data; rebuilding from store');
      const entries = Object.entries(data.store);
      for (const [id, text] of entries) {
        const meta = data.lookup?.[id];
        idx.add(id, `${meta?.title ?? ''} ${text}`);
      }
      console.log('RAG rebuild complete', { docsIndexed: entries.length });
    } else {
      console.warn('RAG data missing both serialized index and store; retrieval will fail.');
    }

    cache = {
      index: idx,
      lookup: data.lookup || {},
      store: data.store,
    };

    return cache;
  } catch (error) {
    console.warn('Failed to load index from Cloud Storage:', error);
    return null;
  }
}

export async function retrieveCandidates(query: string): Promise<ChunkCandidate[]> {
  const loaded = await loadIndex();
  if (!loaded) {
    return [];
  }

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const ids = await searchIndex(loaded.index, trimmedQuery, 24);

  if (ids.length === 0) {
    const fallbackIds = await fallbackSearch(loaded.index, trimmedQuery, 24);
    ids.push(...fallbackIds);
  }

  console.log('RAG search', { q: trimmedQuery, results: ids.length });

  return ids.map((id: string, idx: number) => {
    const meta = loaded.lookup[id] || { title: id };
    const storeText = loaded.store?.[id] || meta.title || '';
    return {
      docId: id,
      score: Math.max(1, 24 - idx),
      sourceTitle: meta.title,
      url: meta.url,
      snippet: buildSnippet(storeText, trimmedQuery),
    };
  });
}

export async function rerankCandidates(candidates: ChunkCandidate[]): Promise<ChunkCandidate[]> {
  return candidates;
}

async function searchIndex(index: any, text: string, limit: number): Promise<string[]> {
  const raw = await index.search(text, { limit });
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && Array.isArray(raw.result)) {
    return raw.result;
  }
  return [];
}

async function fallbackSearch(index: any, query: string, maxResults: number): Promise<string[]> {
  const normalized = query.replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase();
  const terms = Array.from(
    new Set(
      normalized
        .split(/\s+/)
        .filter((token) => token.length > 2)
        .slice(0, 6),
    ),
  );

  const results: string[] = [];
  const seen = new Set<string>();

  for (const term of terms) {
    const termResults = await searchIndex(index, term, 12);
    for (const id of termResults) {
      if (!seen.has(id)) {
        seen.add(id);
        results.push(id);
        if (results.length >= maxResults) {
          return results;
        }
      }
    }
  }

  return results;
}