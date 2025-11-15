/**
 * Embedding-based reranker adapter
 * 
 * This is a drop-in replacement for the simple reranker that uses embeddings
 * to improve retrieval quality. Keeps the same interface so callers don't change.
 * 
 * Usage: Swap `rerankCandidates` import in retrieval.ts when ready to use embeddings.
 */

import type { ChunkCandidate } from './retrieval';

/**
 * Rerank candidates using embedding similarity
 * 
 * This is a placeholder that maintains the same interface.
 * When ready, integrate with:
 * - OpenAI embeddings API
 * - Cohere rerank API
 * - Local embedding model (e.g., sentence-transformers)
 * 
 * For now, returns candidates as-is (same as simple reranker).
 * 
 * @param candidates - Top-K candidates from lexical search
 * @param query - User's question
 * @param topN - Number of results to return
 */
export async function rerankCandidatesWithEmbeddings(
  candidates: ChunkCandidate[],
  _query: string,
  topN: number = 4
): Promise<ChunkCandidate[]> {
  // TODO: Implement embedding-based reranking
  // 
  // Example flow:
  // 1. Generate query embedding (e.g., via OpenAI text-embedding-3-small)
  // 2. Compare with candidate embeddings (pre-computed and stored)
  // 3. Sort by cosine similarity
  // 4. Return top-N
  //
  // For now, fall back to simple reranker behavior
  return candidates.slice(0, topN);
}

/**
 * Hybrid retrieval: lexical + embedding rerank
 * 
 * This combines the best of both worlds:
 * - Fast lexical search for initial filtering
 * - Precise embedding rerank for final selection
 */
export async function hybridRetrieve(
  query: string,
  _topK: number = 12,
  topN: number = 4,
  _scope?: string
): Promise<ChunkCandidate[]> {
  // Import lexical search (keep existing implementation)
  const { retrieveCandidates } = await import('./retrieval');
  
  // Get top-K from lexical search
  const candidates = await retrieveCandidates(query);
  
  // Rerank with embeddings
  return rerankCandidatesWithEmbeddings(candidates, query, topN);
}

