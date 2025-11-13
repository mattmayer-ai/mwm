import * as admin from 'firebase-admin';
import FlexSearch, { Index } from 'flexsearch';

// Admin is initialized in index.ts
const db = admin.firestore();
const storage = admin.storage();

// Define the minimal surface we actually use for FlexSearch
type FlexIndexSerialized = {
  export: () => Promise<string> | string;
  import: (data: unknown) => void; // single-arg serialized import that FlexSearch supports
  search: (q: string, opts?: unknown) => Promise<number[] | string[] | unknown> | number[] | string[] | unknown;
};

export interface ChunkCandidate {
  id: string;
  docId: string;
  sectionId: string;
  text: string;
  sourceUrl: string;
  title: string;
  score: number;
}

/**
 * Load lexical index from Cloud Storage
 */
async function loadIndex(): Promise<FlexIndexSerialized> {
  const bucket = storage.bucket();
  const file = bucket.file('indexes/primary.json');
  
  const [fileContent] = await file.download();
  const indexData = JSON.parse(fileContent.toString());
  
  // Create index with proper typing
  const index: Index = new (FlexSearch as any).Index({
    tokenize: 'forward',
    cache: 100,
  });
  
  // Import serialized data using single-arg form
  (index as unknown as FlexIndexSerialized).import(indexData);
  
  // Return as our minimal surface so callers don't depend on flexsearch types
  return index as unknown as FlexIndexSerialized;
}

/**
 * Retrieve candidate chunks using lexical search
 */
export async function retrieveCandidates(
  query: string,
  topK: number = 12, // Get more candidates for better re-ranking
  scope?: string
): Promise<ChunkCandidate[]> {
  // Load index
  const index = await loadIndex();
  
  // Search index - get top-K * 2 for re-ranking pool
  const searchResults = index.search(query, topK * 2);
  const results = (Array.isArray(searchResults) ? searchResults : await searchResults) as string[];
  
  // Fetch chunk documents from Firestore
  const chunksRef = db.collection('chunks');
  const chunkPromises = results.map((chunkId) => chunksRef.doc(chunkId).get());
  const chunkDocs = await Promise.all(chunkPromises);
  
  // Filter and map to candidates
  const candidates: ChunkCandidate[] = [];
  for (const doc of chunkDocs) {
    if (!doc.exists) continue;
    
    const data = doc.data();
    if (!data) continue;
    
    // Apply scope filter if provided
    if (scope && data.docId !== scope) continue;
    
    // Enhanced re-ranking: term overlap + section title boost + scope boost
    const text = data.text as string;
    const title = data.title as string;
    const queryTerms = query.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();
    const titleLower = title.toLowerCase();
    
    let score = 0;
    for (const term of queryTerms) {
      if (textLower.includes(term)) score += 1;
      if (titleLower.includes(term)) score += 2; // Title boost
    }
    
    // Scope boost: if scope matches docId exactly, boost significantly
    if (scope && data.docId === scope) {
      score += 10; // Strong boost for exact scope match
    } else if (scope && data.docId.startsWith(scope)) {
      score += 5; // Moderate boost for partial match
    }
    
    // Normalize by text length (prefer shorter, more focused chunks)
    score = score / Math.log(text.length + 1);
    
    candidates.push({
      id: doc.id,
      docId: data.docId as string,
      sectionId: data.sectionId as string,
      text,
      sourceUrl: data.sourceUrl as string,
      title: title || 'Untitled',
      score,
    });
  }
  
  // Sort by score and return top-K
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, topK);
}

/**
 * Re-rank candidates to final 3-5 snippets
 */
export function rerankCandidates(
  candidates: ChunkCandidate[],
  maxSnippets: number = 5
): ChunkCandidate[] {
  // Remove duplicates by docId+sectionId, keeping highest score
  const seen = new Map<string, ChunkCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.docId}-${candidate.sectionId}`;
    const existing = seen.get(key);
    if (!existing || candidate.score > existing.score) {
      seen.set(key, candidate);
    }
  }
  
  const unique = Array.from(seen.values());
  unique.sort((a, b) => b.score - a.score);
  
  return unique.slice(0, maxSnippets);
}

