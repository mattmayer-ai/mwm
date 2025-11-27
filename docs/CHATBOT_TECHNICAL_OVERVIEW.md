# Chatbot Technical Overview
**Last Updated:** January 2025  
**Status:** Production (Hallucination prevention system active with ongoing monitoring)

## Executive Summary

The chatbot is a RAG (Retrieval-Augmented Generation) system powered by AWS Bedrock (Claude 3.5 Sonnet) that answers questions about Matt's career, projects, and methodologies. It uses lexical search (FlexSearch) for retrieval, persona knowledge fallback for framework questions, and multi-layer hallucination prevention.

**Key Metrics:**
- **Latency:** p50 ≤ 3s, p95 ≤ 6s (streaming)
- **Content Coverage:** 20+ years, 10,000+ lines of documentation
- **Index Size:** ~500-1000 chunks from MDX/Markdown/PDF sources

**Hallucination Controls:**
- Company whitelist + explicit "do not invent employers" prompt
- Post-processing check for known fake companies + patterns
- Deterministic responses for brag reel / leadership / 90-day plan (bypass LLM)
- Known fake brag pattern detection
- Ongoing monitoring via logs and analytics

---

## Architecture

### High-Level Flow

```
User Question
    ↓
Intent Routing (SmallTalk/Contact/RAG)
    ↓
Deterministic Response Check (NEW)
    ├─ User said "yes" to brag reel/leadership/90-day plan?
    │  └─ YES → Retrieve full document from index → Return directly (bypass LLM)
    └─ NO → Continue to RAG
    ↓
RAG Retrieval (FlexSearch lexical search)
    ↓
Query Expansion (synonyms, acronyms, project names)
    ↓
Top-K Retrieval (24 candidates)
    ↓
Priority Boosting (project-specific, question-type)
    ↓
Reranking (placeholder - returns as-is)
    ↓
Context Assembly (top 6 chunks)
    ↓
Persona Knowledge Fallback (if no context + framework question)
    ↓
Prompt Construction (system + user prompts)
    ↓
AWS Bedrock (Claude 3.5 Sonnet)
    ↓
Post-Processing (hallucination detection, citation extraction)
    ↓
Response (SSE streaming)
```

### Technology Stack

**Frontend:**
- React 19 + Vite 7.7
- React Router DOM 7.4
- Tailwind CSS 3.3.6
- Radix UI primitives

**Backend:**
- Firebase Functions (Node.js 20, 2nd Gen)
- AWS Bedrock Runtime (Claude 3.5 Sonnet)
- Firebase Firestore (chunks, metadata, analytics)
- Firebase Cloud Storage (lexical index)
- FlexSearch (lexical search engine)

**AI/ML:**
- **LLM:** Anthropic Claude 3.5 Sonnet (via AWS Bedrock)
- **Retrieval:** Lexical search (FlexSearch) - upgrade path to embeddings ready
- **Reranking:** Placeholder (returns candidates as-is)

---

## RAG System

### Content Ingestion Pipeline

**Source Files:**
- `/content/projects/*.mdx` - Project case studies
- `/content/resume/*.mdx` - Resume content
- `/content/teaching/*.mdx` - Teaching experience
- `/content/interviews/*.mdx` - Interview Q&A
- `/content/responses/*.mdx` - Deterministic responses (brag reel, leadership, 90-day plan)
- `/content/data/*.json` - Structured data

**Chunking Strategy:**
- **Chunk Size:** 1,100 characters (~800-900 tokens)
- **Overlap:** 180 characters (~12% overlap)
- **Chunk ID Format:** `{docId}#{index}` (e.g., `cns-ai-powered-innovation-platform#000`)
- **Response Documents:** Stored as full documents (not chunked) with `type: 'response'` for direct retrieval

**Indexing:**
- **Script:** `scripts/build_primary.ts`
- **Output:** `indexes/primary.json` (uploaded to Cloud Storage)
- **Index Type:** FlexSearch with forward tokenization, match preset
- **Searchable Text:** `{doc.title} {chunk.text}` (title + chunk content)

**Storage:**
- **Firestore:** Chunks stored in `chunks` collection (read-only)
- **Cloud Storage:** Serialized FlexSearch index in `indexes/primary.json`
- **Metadata:** Document-level lookup in `docLookup`, chunk-level in `lookup`

### Retrieval Process

**1. Deterministic Response Handler** (`functions/src/chat.ts:173-230`) - **NEW**
- Detects when user accepts prompts (says "yes" to brag reel/leadership/90-day plan)
- Retrieves full document text directly from index store via `getFullDocument()`
- Bypasses RAG search and LLM entirely
- Returns pre-written content from `/content/responses/*.mdx` files
- Eliminates hallucination risk for these high-frequency responses

**2. Query Expansion** (`functions/src/retrieval.ts:expandQuery`)
- Synonym mapping (northstar → north star, time-to-insight, TTI)
- Acronym expansion (CNS → Central Nervous System, Multi-Agent Innovation Platform)
- Project name expansion (TakeCost → AutoTake, construction estimation)
- Technology expansion (AWS → Amazon Web Services, Bedrock)

**3. Lexical Search** (`functions/src/retrieval.ts:searchIndex`)
- FlexSearch forward tokenization
- Returns top 24 candidates
- Fallback: term-by-term search if primary search fails

**4. Priority Boosting** (`functions/src/chat.ts:260-302`)
- Question-type detection (philosophy, achievement, project-specific)
- Document ID priority matching
- Boosts relevant chunks to top of results

**5. Context Assembly**
- Top 6 chunks selected after priority boosting
- Snippets built with query highlighting (240 char max)
- Metadata includes: `title`, `sourceUrl`, `snippet`

### Reranking (Future Enhancement)

**Current:** Placeholder function returns candidates as-is  
**Planned:** Embedding-based reranking (see `functions/src/retrieval-embedding.ts`)
- Hybrid approach: lexical search → embedding rerank
- Pre-computed chunk embeddings
- Cosine similarity scoring

---

## Prompt System

### System Prompt Structure

**Base Prompt** (`functions/src/prompts.ts:SYSTEM_PROMPT_BASE`):
1. **Company Whitelist** (CRITICAL - prevents hallucination)
   - Altima Ltd. (2008)
   - Pixilink (2009-2010)
   - Air Canada (2010-2018)
   - RaceRocks 3D (2018-2024)
   - Swift Racks (2024-Present)
   - Schulich School of Business (2024-Present)

2. **Core Rules:**
   - Answer from CONTEXT when available
   - Use PERSONA KNOWLEDGE for frameworks when CONTEXT is thin
   - First-person voice ("I")
   - Never invent employers, dates, metrics
   - Avoid generic refusals; use reasoning for in-domain questions
   - Default length ≤160 words (expand to 5-7 bullets for highlights)

3. **Tone Blocks** (dynamic based on question):
   - **Professional:** Concise, outcome-focused, confident
   - **Narrative:** Situation → insight → decision → result
   - **Personal:** Gated, reflective, max 180 words (requires `allowPersonal` flag)

4. **Persona Knowledge Block** (optional, injected when needed):
   - North Star Metrics
   - Product Philosophy
   - Leadership Style
   - Experimentation Approach
   - Team Operating System
   - Strategy Development
   - Data & Decision Making
   - Speed & Execution
   - Pivots & Change Management

### User Prompt Structure

**Question Block:**
- User's question (trimmed)

**Context Block:**
- Numbered citations: `[1] (Title) snippet...`
- Max 6 chunks
- 400 char snippets

**Instructions:**
- Answer from CONTEXT
- Company whitelist reminder
- Question-type specific guidance (philosophy, achievement, acronym, project)
- Citation format: `[n]` inline markers

**History Block** (optional):
- Last 2 conversation turns
- Used for context continuity

### Persona Knowledge Fallback

**Trigger Conditions:**
- No RAG context retrieved
- Question matches framework keywords
- Bot suggested topic in small talk

**Knowledge Sections** (`functions/src/persona.ts:PERSONA_KNOWLEDGE`):
- Static, always-available knowledge about frameworks
- Semantic aliases for query matching
- Topic-specific extraction (e.g., "north star" → North Star Metrics section)

---

## LLM/Agent Configuration

### AWS Bedrock Setup

**Client:** `functions/src/bedrock.ts`
- Region: `us-east-1` (Anthropic Claude access)
- Credentials: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (Firebase secrets)
- SDK: `@aws-sdk/client-bedrock-runtime`

**Model:** `anthropic.claude-3-5-sonnet-20240620-v1:0`

**Inference Config:**
- **Max Tokens:** 180 (personal), 600 (professional/narrative)
- **Temperature:** 0.1 (low for consistency)
- **Top-P:** 0.9

**Message Format:**
- System message: Full system prompt
- User messages: Historical turns + current user prompt
- Content format: `[{ text: string }]` (text-only, no images)

### Streaming

**Format:** Server-Sent Events (SSE)
- `data: { type: 'chunk', content: string }`
- `data: { type: 'done', citations: [], tone: string }`
- `data: { type: 'error', code: string, message: string }`

**Note:** Currently sends full answer in one chunk (not token-by-token streaming)

---

## Hallucination Prevention

### Multi-Layer Defense

**1. Prompt-Level Guardrails**
- Explicit company whitelist in system prompt
- "NEVER invent employers, clients, dates, job titles, or metrics"
- Company restrictions repeated in user prompt

**2. Deterministic Response Handlers** (`functions/src/chat.ts:171-230`)
- Brag reel, leadership philosophy, and 90-day plan responses stored in content files
- When user accepts these prompts (says "yes"), bypass LLM entirely
- Retrieve full document text directly from index store
- Eliminates hallucination risk for these high-frequency responses

**3. Post-Processing Detection** (`functions/src/chat.ts:412-450`)
- Fake company blacklist (Quora, Course Hero, Airbnb, Reddit, Google, Meta, etc.)
- Known fake brag pattern detection (e.g., "led product at quora", "drove 300% revenue at course hero")
- String matching on answer (case-insensitive)
- Automatic answer replacement if detected
- Debug logging before final output to verify detection is running

**4. Logging & Monitoring**
- Hallucination events logged with correlation ID
- "FINAL ANSWER" debug logs include detection flags
- Analytics tracked in Firestore `analytics` collection
- Error-level logging for investigation

**5. Self-Consistency Validation** (`functions/src/chat.ts:451-473`)
- Detects refusal patterns when bot suggested topic
- Warns if persona fallback should have been used

### Current Status

**Prevention System:** Multi-layer system active with ongoing monitoring  
**Last Incident:** Fixed January 2025 (fake company mentions in brag reel)  
**Known Limitations:** LLM may still hallucinate for novel questions outside deterministic handlers; detection system catches and corrects post-generation

---

## Database Schema

### Firestore Collections

**`chunks`** (read-only)
```typescript
{
  docId: string;           // Source document ID
  sectionId: string;       // Section identifier
  text: string;            // Chunk text
  sourceUrl: string;      // URL to source
  title: string;          // Document title
  createdAt: Timestamp;   // Creation timestamp
}
```

**`sources`** (read-only)
```typescript
{
  id: string;             // Document ID
  title: string;         // Document title
  url: string;           // Source URL
  createdAt: string;     // ISO timestamp
  updatedAt: string;     // ISO timestamp
}
```

**`meta/index`** (read-only)
```typescript
{
  lastIndexedAt: Timestamp;  // Last reindex timestamp
  version: number;            // Index version
}
```

**`meta/settings`** (admin-writable)
```typescript
{
  allowPersonal: boolean;    // Enable personal tone mode
  updatedAt: string;         // ISO timestamp
}
```

**`analytics`** (client-writable)
```typescript
{
  eventType: 'chat_complete';
  timestamp: Timestamp;
  tone: 'professional' | 'narrative' | 'personal';
  latencyMs: number;
  citationCount: number;
  hasCitations: boolean;
  tokenIn: number;
  tokenOut: number;
  correlationId: string;
}
```

**`_rateLimits`** (internal, no client access)
```typescript
{
  count: number;              // Request count
  clientId: string;          // IP address
  windowStart: Timestamp;     // Window start time
  updatedAt: Timestamp;      // Last update
}
```

### Cloud Storage

**`indexes/primary.json`**
```json
{
  "version": 2,
  "createdAt": "ISO timestamp",
  "index": { /* FlexSearch serialized index */ },
  "lookup": { /* chunkId → metadata */ },
  "store": { /* chunkId → chunk text */ },
  "docLookup": { /* docId → document metadata */ },
  "chunks": [ /* full chunk objects */ ]
}
```

---

## Rate Limiting

### Configuration

**Per-Minute Limit:**
- Max: 30 requests
- Window: 60 seconds

**Daily Limit:**
- Max: 200 requests
- Window: 24 hours

### Implementation

**Tracking:** Firestore `_rateLimits` collection
- Key format: `ratelimit:{ip}:{windowBucket}`
- Increment counter on each request
- Fail-open on errors (allows request if check fails)

**Cleanup:** Scheduled function (`cleanupRateLimitsScheduled`)
- Removes entries older than 7 days
- Runs periodically to prevent collection bloat

**Client Identification:**
- Primary: `X-Forwarded-For` header (first IP)
- Fallback: `req.ip`
- Default: `'unknown'`

---

## Intent Routing

### Small Talk

**Pattern:** `/^(hi|hello|hey|...)\b/i` (≤20 chars)  
**Response:** Random selection from 30+ friendly greetings  
**Bypass:** RAG retrieval skipped

### Contact

**Pattern:** `/(hire|availability|book|rates?|contact|email|linked ?in|cal\.?com|schedule)/i`  
**Response:** Contact information + offer to highlight wins  
**Bypass:** RAG retrieval skipped

### RAG (Default)

**All other questions** → Full RAG pipeline

---

## Deployment

### Functions

**Deploy Command:**
```bash
firebase deploy --only functions
```

**Functions:**
- `chat(us-east1)` - Main chat endpoint
- `settings(us-central1)` - Admin settings
- `contact(us-central1)` - Contact form
- `health(us-central1)` - Health check
- `reindex(us-central1)` - Content reindexing (admin-only)
- `updateIndexDate(us-central1)` - Index metadata update
- `cleanupRateLimitsScheduled(us-central1)` - Rate limit cleanup

### Index Rebuild

**Script:** `scripts/build_primary.ts`
**Output:** `indexes/primary.json`
**Upload:** Manual or via `reindex` function
**Trigger:** Admin panel or direct function call

### Environment Variables

**Firebase Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `ADMIN_EMAIL`

**Function Config:**
- `STORAGE_BUCKET` (defaults to Firebase project bucket)
- `ALLOW_PERSONAL` (fallback if Firestore read fails)

---

## Monitoring & Observability

### Logging

**Structured Logs:**
- Correlation ID for request tracking
- RAG metrics (candidate count, latency)
- Token usage (in/out)
- Citation count
- Tone selection

**Error Logging:**
- Hallucination detection events
- Rate limit violations
- RAG retrieval failures
- Bedrock API errors

### Analytics

**Firestore Collection:** `analytics`
- Event: `chat_complete`
- Metrics: latency, tokens, citations, tone
- Non-blocking (errors don't fail request)

### Health Checks

**Endpoint:** `/api/health`
- Returns 200 OK if system operational
- Used for uptime monitoring

---

## Recent Improvements (January 2025)

### Deterministic Response Handlers
- **Problem:** LLM was hallucinating companies (Quora, Course Hero, Airbnb, Reddit) when users said "yes" to brag reel prompts
- **Solution:** Created content files for brag reel, leadership philosophy, and 90-day plan responses
- **Implementation:** 
  - Responses stored in `/content/responses/*.mdx` (updatable without code changes)
  - Detection logic catches "yes" responses to these prompts
  - Bypasses LLM entirely, retrieves full document text directly
  - Zero hallucination risk for these high-frequency responses

### Enhanced Hallucination Detection
- Added known fake brag pattern detection (e.g., "led product at quora", "drove 300% revenue at course hero")
- Enhanced post-processing to catch both fake companies AND fake brag patterns
- Added debug logging ("FINAL ANSWER") to verify detection is running
- Automatic answer replacement with corrected version

### Prompt Improvements
- Softened "never say I don't know" rule to prevent encouraging BS
- Changed to "avoid generic refusals" with guidance to use reasoning for in-domain questions
- Updated contact email to correct address

---

## Recent Improvements (January 2025)

### Deterministic Response Handlers
- **Problem:** LLM was hallucinating companies (Quora, Course Hero, Airbnb, Reddit) when users said "yes" to brag reel prompts
- **Solution:** Created content files for brag reel, leadership philosophy, and 90-day plan responses
- **Implementation:** 
  - Responses stored in `/content/responses/*.mdx` (updatable without code changes)
  - Detection logic catches "yes" responses to these prompts
  - Bypasses LLM entirely, retrieves full document text directly
  - Zero hallucination risk for these high-frequency responses

### Enhanced Hallucination Detection
- Added known fake brag pattern detection (e.g., "led product at quora", "drove 300% revenue at course hero")
- Enhanced post-processing to catch both fake companies AND fake brag patterns
- Added debug logging ("FINAL ANSWER") to verify detection is running
- Automatic answer replacement with corrected version

### Prompt Improvements
- Softened "never say I don't know" rule to prevent encouraging BS
- Changed to "avoid generic refusals" with guidance to use reasoning for in-domain questions
- Updated contact email to correct address

---

## Future Enhancements

### Planned

1. **Embedding-Based Reranking**
   - Pre-compute chunk embeddings
   - Hybrid retrieval: lexical → embedding rerank
   - Improve precision for semantic queries

2. **Token-by-Token Streaming**
   - Real-time response streaming
   - Better perceived latency

3. **Citation Quality Scoring**
   - Rank citations by relevance
   - Filter low-quality citations

4. **Conversation Memory**
   - Persistent session storage
   - Multi-turn context awareness

### Considered

1. **Vector Database Migration**
   - Pinecone, Weaviate, or Qdrant
   - Replace FlexSearch with semantic search
   - Better handling of paraphrased queries

2. **Multi-Model Fallback**
   - Try Claude, fallback to GPT-4 if needed
   - Cost optimization

3. **A/B Testing Framework**
   - Test prompt variations
   - Measure citation quality
   - Optimize retrieval parameters

---

## Security

### Authentication

**Admin Endpoints:**
- `/api/reindex` - Firebase Auth token required
- `/api/settings` - Firebase Auth token + email match

**Public Endpoints:**
- `/api/chat` - Rate-limited, no auth required
- `/api/contact` - Rate-limited, no auth required

### Data Privacy

- No PII stored in analytics
- Session IDs anonymized
- Rate limits by IP (no user tracking)

### API Keys

- AWS credentials in Firebase secrets (never in client)
- All AI calls server-side
- No API keys exposed to frontend

---

## Performance Targets

**Chat Latency:**
- p50: ≤ 3s
- p95: ≤ 6s

**Page Load:**
- LCP: ≤ 2.5s
- FCP: < 1.5s

**Retrieval:**
- Index load: < 500ms (cached after first load)
- Search: < 100ms
- Total RAG: < 1s

---

## Troubleshooting

### Common Issues

**1. Hallucinations**
- Check company whitelist in prompts
- Verify post-processing detection is active
- Review logs for detection events

**2. Poor Retrieval**
- Check index version in Cloud Storage
- Verify query expansion is working
- Review priority boosting logic

**3. Rate Limit Errors**
- Check Firestore `_rateLimits` collection
- Verify cleanup function is running
- Review rate limit configuration

**4. Slow Responses**
- Check Bedrock API latency
- Review RAG retrieval time
- Verify index is cached

---

## Content Management

### Updating Deterministic Responses

The brag reel, leadership philosophy, and 90-day plan responses are stored in content files for easy updates:

- **Files:** `/content/responses/brag-reel.mdx`, `/content/responses/leadership-philosophy.mdx`, `/content/responses/first-90-day-plan.mdx`
- **Update Process:**
  1. Edit the MDX file with new content
  2. Run reindex: `npm run build:index` (or equivalent)
  3. Upload new index to Cloud Storage
  4. Changes take effect immediately (no function redeployment needed)

### Reindexing Content

**Script:** `scripts/build_primary.ts`  
**Output:** `indexes/primary.json`  
**Upload:** Manual or via `reindex` function  
**Trigger:** Admin panel or direct function call

---

## Contact

**Technical Questions:** Review code in `/functions/src`  
**Content Updates:** Modify files in `/content` and run reindex  
**Deployment Issues:** Check Firebase console logs

---

**Document Version:** 1.1  
**Last Reviewed:** January 2025  
**Last Updated:** January 2025 (Added deterministic response handlers, enhanced hallucination detection)  
**Next Review:** Q2 2025

