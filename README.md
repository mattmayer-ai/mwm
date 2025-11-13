# mwm — AI-Driven Portfolio

An AI-powered portfolio site built with React 19, Vite, Firebase, and Anthropic Claude.

## Status

**Phase 1 & 2 Complete** ✅
- Content ingestion pipeline (P1.1-P1.4)
- AI chat with citations (P2.1-P2.3)
- Lexical search-based RAG

**Remaining:**
- Owner UI for reindexing (P1.5)
- QA eval harness (P2.4)
- Projects directory & case studies (Phase 3)
- Resume/Contact/Trust UI/Theming (Phase 4)
- Analytics & deploy (Phase 5)

## Tech Stack

- **Frontend**: React 19 + Vite 7.7, TypeScript 5.9.3, Tailwind CSS 3.4, Radix UI
- **Backend**: Firebase 12.4.0 (Firestore, Cloud Functions, Hosting)
- **AI**: Anthropic Claude 3.5 Sonnet via Firebase Functions
- **Search**: FlexSearch (lexical search, upgrade path to embeddings)

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

1. Add your content to `/content/projects/*.mdx` and `/content/resume/resume.md`
2. Add resume PDF to `/public/resume/mwm-resume.pdf`
3. Run ingestion:
   ```bash
   npm run ingest
   ```
   Or trigger via API (admin-only):
   ```bash
   curl -X POST https://your-project.cloudfunctions.net/api/reindex \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "X-Admin-Secret: YOUR_SECRET"
   ```

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

## Notes

- The ingestion script uses Firebase client SDK; for production, consider migrating to Admin SDK
- Lexical search is used for MVP; upgrade path to vector embeddings is planned
- Chat API streams responses for better UX
- All AI calls are server-side via Firebase Functions

## License

Private project

