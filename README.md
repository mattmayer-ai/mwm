# mwm — AI-Driven Portfolio

An AI-powered portfolio site built with React 19, Vite, Firebase, and Anthropic Claude. Features an interactive chat interface powered by RAG (Retrieval-Augmented Generation) that answers questions about Matt's career, projects, and methodologies using over 15,000 lines of real documentation spanning nearly 20 years of experience.

## Status

**Production Ready** ✅

**Completed Features:**
- ✅ Content ingestion pipeline with FlexSearch lexical indexing
- ✅ AI chat with citations powered by Claude 3.5 Sonnet (AWS Bedrock)
- ✅ RAG system with deterministic response handlers
- ✅ Projects directory with filtering and case studies
- ✅ Portfolio cards with impact metrics
- ✅ Resume/Contact/Trust UI with dark mode support
- ✅ Analytics tracking and deployment pipeline
- ✅ Multi-layer hallucination prevention system
- ✅ Rate limiting and security controls

**Live Site:** https://askmwm.web.app

## Tech Stack

**Frontend:**
- React 19 + Vite 7.7
- TypeScript 5.9.3 (strict mode)
- Tailwind CSS 3.4.17
- Radix UI primitives (Dialog, Dropdown Menu, Select, Tabs, Toast)
- React Router DOM 7.4
- Zustand 5.8 for state management
- Lucide React + Heroicons for icons

**Backend:**
- Firebase 12.4.0
  - Firestore (chunks, metadata, analytics)
  - Cloud Functions (Node.js 20, 2nd Gen)
  - Cloud Storage (lexical index)
  - Firebase Hosting

**AI/ML:**
- Anthropic Claude 3.5 Sonnet via AWS Bedrock
- FlexSearch (lexical search, upgrade path to embeddings)
- RAG system with query expansion and priority boosting

## Setup

### Prerequisites

- Node.js 20 LTS
- npm or pnpm
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Firestore, Storage, and Functions enabled

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```
3. Copy `.env.example` to `.env.local` and fill in your Firebase config and API keys
4. Initialize Firebase (if not already done):
   ```bash
   firebase login
   firebase init
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

### Environment Variables

See `.env.example` for required variables:

- `VITE_FIREBASE_*` - Firebase client config
- `ANTHROPIC_API_KEY` - Anthropic API key (set in Firebase Functions config)
- `ADMIN_EMAIL` - Owner email for reindex authorization
- `VITE_LOGROCKET_APP_ID` - LogRocket app ID (optional)

### Content Ingestion

The system indexes content from multiple sources:

**Source Files:**
- `/content/projects/*.mdx` - Project case studies
- `/content/resume/*.mdx` - Resume content
- `/content/teaching/*.mdx` - Teaching experience
- `/content/interviews/*.mdx` - Interview Q&A
- `/content/responses/*.mdx` - Deterministic responses (brag reel, leadership, 90-day plan)
- `/content/data/*.json` - Structured data

**Ingestion Process:**
1. Add your content to the appropriate directories
2. Run ingestion:
   ```bash
   npm run ingest
   ```
3. Build the enriched primary index:
   ```bash
   npm run build:primary
   ```
4. Upload to Cloud Storage:
   ```bash
   gsutil cp indexes/primary.json gs://askmwm/indexes/primary.json
   ```
   Or trigger via admin API:
   ```bash
   curl -X POST https://us-central1-askmwm.cloudfunctions.net/api/reindex \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

**Chunking Strategy:**
- Chunk size: 1,100 characters (~800-900 tokens)
- Overlap: 180 characters (~12% overlap)
- Index type: FlexSearch with forward tokenization

### Firebase Functions Deployment

```bash
cd functions
npm run build
firebase deploy --only functions
```

### Firebase Hosting Deployment

```bash
npm run build
firebase deploy --only hosting
```

## Project Structure

```
/src
  /app          # App entry and routing
  /features     # Feature modules (chat, projects, admin)
  /lib          # Utilities (Firebase, types, etc.)
/scripts        # Ingestion script
/functions      # Firebase Cloud Functions
/content        # MDX/Markdown content
/public         # Static assets
/tests          # Test files
```

## Development

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run typecheck` - Type check
- `npm run lint` - Lint code
- `npm run test` - Run tests
- `npm run ingest` - Run content ingestion

## Key Features

**RAG System:**
- Lexical search with FlexSearch (upgrade path to embeddings ready)
- Query expansion (synonyms, acronyms, project names)
- Priority boosting for project-specific questions
- Deterministic response handlers for high-frequency queries
- Multi-layer hallucination prevention

**Content Coverage:**
- Over 15,000 lines of real documentation
- Nearly 20 years of career experience
- Projects from Air Canada, RaceRocks, Swift Racks, and Schulich School of Business
- Case studies, frameworks, teaching notes, and methodologies

**Performance:**
- Chat latency: p50 ≤ 3s, p95 ≤ 6s (streaming)
- Page load: LCP ≤ 2.5s, FCP < 1.5s
- Retrieval: < 1s total RAG time

**Security:**
- All AI calls server-side via Firebase Functions
- Rate limiting (30/min, 200/day)
- No API keys exposed to frontend
- Admin-only reindex endpoints

## License

Private project

