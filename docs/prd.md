## 0) Assumptions & constraints (working draft)

* **Goal:** Showcase your portfolio *and* your AI product/dev capability via an interactive, trustworthy AI chat and dashboard UI (MagicPatterns-like).
* **Primary audiences:**

  1. Recruiters / hiring managers,
  2. Potential clients / founders,
  3. Technical peers (PMs/engineers/designers),
  4. You (the site owner/admin).
* **MVP footprint:** Static/SSR site (Next.js or similar) + chat with RAG over your curated content; contact/booking; project/case study cards; analytics; simple CMS (MDX/Notion ingest).
* **Non-goals for MVP:** Multi-tenant, payments, gated/private projects, multi-language, long-running autonomous agents, complex code execution from untrusted user input.

---

## 1) Finalized & Prioritized User Stories (MVP)

Format: “As a [user], I want [action] so that [benefit].”
Each story includes acceptance criteria (what “done” means).

### MUST HAVE (core MVP)

**U1. AI chat answers about my experience with citations**

* *As a recruiter*, I want to ask natural‑language questions about your background so that I can quickly assess fit.
  **Acceptance**

  * Questions return answers in ≤3s p50 (≤6s p95) with inline citations to specific portfolio sources.
  * Clicking a citation opens the source section (case study, resume segment).
  * Safety: the chat refuses to answer outside scope (no personal data it hasn’t been given).

**U2. Project & case study browsing with filters**

* *As a visitor*, I want to scan projects and filter by role, domain, impact, and skills so that I can find relevant work quickly.
  **Acceptance**

  * Grid/list view; filters (role, industry, skills, year); deep‑linkable query params.
  * Each card shows title, 1‑line impact, tags, and a “View details” link.

**U3. Case study detail pages that highlight measurable outcomes**

* *As a visitor*, I want concise case study pages with problem → approach → outcome so that I can understand impact fast.
  **Acceptance**

  * Sections: Context, Constraints, Process, Decisions, Metrics, Artifacts, Learnings.
  * Pull‑quotes for KPIs (e.g., “+18% retention”).
  * “Ask AI about this project” chip starts a chat pre‑seeded with the case study context.

**U4. Single‑page resume / About + PDF download**

* *As a visitor*, I want a clean resume page and a downloadable PDF so that I can share internally.
  **Acceptance**

  * One‑pager resume view + “Download PDF” (<= 1MB).
  * Structured metadata (schema.org Person/Resume) for SEO.

**U5. Contact & calendar booking**

* *As a client or recruiter*, I want to contact you or book time so that next steps are fast.
  **Acceptance**

  * Contact form with spam protection and success state.
  * Optional booking link (Calendly/Cal.com); events create confirmation email.

**U6. RAG content ingestion pipeline (owner)**

* *As the owner*, I want to ingest/update my content (MDX/Notion/GitHub) into a vector index so that the chat stays accurate.
  **Acceptance**

  * CLI or dashboard “Re‑index” button; progress + last indexed timestamp.
  * File types: MDX/Markdown + PDFs (resume) + site pages.
  * Embeds store docId, sectionId, source URL, and chunk text.

**U7. Analytics dashboard (engagement & funnels)**

* *As the owner*, I want to track visits, chat engagement, and contact conversions so that I can optimize content.
  **Acceptance**

  * Metrics: unique visitors, time on site, chat started %, messages per session, citation open rate, contact conversion.
  * Privacy‑respecting (no PII; anonymized session id).

**U8. Trust & transparency UI**

* *As a visitor*, I want clear indicators of what the AI knows and how it answers so that I can trust it.
  **Acceptance**

  * “How the AI works” modal; data sources listed; last indexed date; disclaimers.
  * Every answer shows citations by default.

### SHOULD HAVE (important, can ship after MVP)

**S1. Global semantic search (projects + content)**

* *As a visitor*, I want a global search to find relevant projects and pages quickly.
  **Acceptance**

  * Cmd/Ctrl+K opens search; results across projects, resume, posts, with highlighting.

**S2. Shareable chat links**

* *As a visitor*, I want to share a specific answer or conversation so that others can review it.
  **Acceptance**

  * “Copy link to answer” creates a read‑only, redacted permalink.

**S3. Technical artifacts & code refs**

* *As a technical peer*, I want to see sanitized code snippets and links to repos so that I can gauge depth.
  **Acceptance**

  * Artifact section supports code blocks with language labels; external links.

**S4. Theming & dark mode**

* *As a visitor*, I want light/dark mode and a refined dashboard aesthetic (MagicPatterns vibe) so that it feels polished.
  **Acceptance**

  * System preference default; toggle persists.

### COULD HAVE (nice-to-haves)

**C1. Multi‑language content skeleton**
**C2. Gated/private case studies via passcode**
**C3. Newsletter sign‑up**
**C4. Small, sandboxed “AI demo” widget (prompt → component JSON), no external calls**

---

## 2) MVP Scope Boundaries

* **In scope:** U1–U8 + S4 (dark mode) for a professional first release.
* **Out of scope (for MVP):** user auth for visitors, payments, multi‑tenant CMS, heavy agentic automation, running arbitrary user code, multi‑language, private/gated content.

---

## 3) PRD — *mwm* (AI Chat Portfolio)

### 3.1 Purpose & Vision

* **Purpose:** Demonstrate your product leadership and AI development capability through a fast, credible, and delightful chat‑first portfolio.
* **Vision:** A single destination that answers “What have you built? How did you decide? What was the impact?” in seconds—with sources.

### 3.2 Release 1 Scope (MVP)

* Deliver all **MUST** stories (U1–U8) + **S4** theming.
* Hosting (e.g., Vercel/Netlify), CI, analytics, and re‑index pipeline.

### 3.3 Key Personas

* **Recruiter/Hiring Manager (Primary):** Skims quickly, needs trust, wants proofs and metrics; success = confidence to move forward.
* **Client/Founder (Primary):** Seeks domain fit, timeline realism; success = books a call.
* **Technical Peer (Secondary):** Evaluates depth; success = sees credible artifacts.
* **Site Owner/Admin (You):** Wants low‑friction content updates & insights; success = high chat engagement and conversion.

### 3.4 User Journeys (happy paths)

1. **Quick evaluation (Recruiter):** Land → “Top projects” → Ask “What did you do at X?” → Read answer + citations → Download resume → Book intro.
2. **Deep dive (Client):** Land → Filter projects by domain → Open case study → “Ask AI” contextual Q&A → Share link → Contact.
3. **Owner update:** Add/edit MDX case study → “Re‑index” → Validate with test question → Check analytics next day.

### 3.5 Functional Requirements (FR) with Acceptance Criteria

**FR1: AI Chat with RAG & Citations (U1)**

* Returns answers with **at least two** ranked citations to exact sections.
* Denies questions outside knowledge scope with helpful message.
* **Latency:** p50 ≤ 3s, p95 ≤ 6s (streaming acceptable).
* **Quality:** Answers must not contradict cited sources (manual spot checks in QA suite).

**FR2: Project & Case Study Directory (U2)**

* Filter chips: role, industry, skills, year.
* URL reflects filters (deep link).
* ≥ 6 cards render within 1s on desktop first load.

**FR3: Case Study Template (U3)**

* Required fields: context, constraints, process, decisions, outcomes (metrics), artifacts.
* “Ask AI about this project” preloads RAG with the case study docId.

**FR4: Resume / About (U4)**

* Structured schema.org metadata; PDF export ≤1MB.
* “Copy summary” button (1‑paragraph bio) for recruiter notes.

**FR5: Contact & Booking (U5)**

* Form validation, spam honeypot, success toast; sends email to owner.
* Scheduling deep link (e.g., /book) with time‑zone awareness.

**FR6: Content Ingestion & Re‑Index (U6)**

* Sources: `/content` (MDX), PDF resume, generated HTML pages.
* Chunking window size & overlap configurable; stores docId, sectionId, source URL, chunk text, embedding vector.
* “Last indexed” timestamp visible in “How it works.”

**FR7: Analytics (U7)**

* Events: page_view, chat_start, chat_message, citation_click, contact_submit, resume_download.
* Dashboard: last 30/90 days, trend lines, conversion funnel.

**FR8: Trust UI (U8)**

* “How the AI works” modal: data sources, last indexed time, model/provider, privacy note.

**FR9: Theming (S4)**

* Light/dark mode; MagicPatterns‑inspired dashboard layout (sidebar + cards).

> **Definition of Done (DoD):** All FRs have passing QA scenarios, accessibility checks, and performance budgets validated in CI.

### 3.6 Non‑Functional Requirements (NFR)

* **Performance:** First contentful paint < 1.5s on desktop reference; LCP < 2.5s; chat latency targets (FR1).
* **Reliability:** Availability ≥ 99.5% monthly; graceful degradation if AI provider unavailable.
* **Security & Privacy:** HTTPS, HSTS, form spam protection, rate limiting on chat; do not log PII in analytics; redact emails in chat transcripts.
* **Accessibility:** WCAG 2.2 AA; keyboard navigation; focus states; sufficient color contrast.
* **SEO:** Clean routes, sitemap, OpenGraph, JSON‑LD (Person, CreativeWork, Article where applicable).
* **Observability:** Error logging + AI request tracing (prompt, token usage, latency; sensitive text redacted).

### 3.7 Information Architecture & Data Model

**Content entities**

* **Project** `{ id, title, slug, summary, role, industry, skills[], year, impactMetrics[], heroImage, artifacts[] }`
* **CaseStudy** `{ projectId, sections[{id, type, body}], outcomes[{metric, baseline, result, delta}] }`
* **Resume** `{ id, bio, experience[], education[], skills[] }`
* **SourceDoc** `{ id, type ('mdx'|'pdf'|'html'), url, title, updatedAt }`
* **EmbeddingChunk** `{ id, docId, sectionId, text, vector, sourceUrl, createdAt }`
* **ChatTurn** `{ id, sessionId, role, text, citations[{docId, sectionId, sourceUrl}], createdAt }`
* **ContactRequest** `{ id, name, email, message, createdAt, source }`

**Navigation**

* `/` Dashboard (hero, top projects, chat), `/projects`, `/projects/[slug]`, `/about`, `/contact`, `/book`, `/ai/how-it-works`.

### 3.8 UX References & Design System

* **Aesthetic:** Card‑based dashboard, spacious grid, subtle depth; micro‑interactions (hover, skeleton loaders).
* **Components:** Button, Input, Select, Tag, Badge, Card, Dialog/Sheet, Toast, Tooltip, Tabs, Breadcrumbs, Empty State.
* **Design tokens:** spacing scale 4/8px, type scale (12–20 body, 28/36 display), radius 8–12, shadows 1–3.
* **Dark mode:** Auto via prefers-color-scheme with manual override.

### 3.9 Acceptance Criteria (sample, per feature)

* **Chat correctness:** For a seeded test set of 25 Qs, ≥ 80% answers judged “accurate & supported” by citations; 0 hallucinated employers.
* **Filters:** With 3 active filters, results update < 200ms; URL sync; refresh preserves.
* **Re‑index:** After editing any MDX file, running re‑index reflects in chat within 2 minutes.
* **Contact form:** Valid submission triggers email; rate limit 5/min/IP; bot trap blocks obvious spam.

### 3.10 Analytics & Success Metrics

* **North star:** *Qualified contact rate* (contact submissions from sessions with ≥ 2 chat messages).
* Supporting: chat start rate ≥ 35%; citation click‑through ≥ 30%; resume downloads per 100 visits; time on site; returning visitor %.
* A/B later: hero copy, case study ordering.

### 3.11 Content & States

* **Empty:** No search results; no projects (owner view shows “Add content”).
* **Loading:** Skeletons for cards, streaming chat tokens.
* **Error:** AI provider down → fallback message + email CTA; contact submit failure → retry guidance.
* **Legal:** Privacy note, “AI answers synthesized from my portfolio; check citations.”

### 3.12 Accessibility & Design System

* Keyboard‑first nav, skip‑to‑content link, ARIA roles in chat and citation lists, focus rings, reduced‑motion support.

### 3.13 Security, Privacy, Compliance

* No training on visitor questions; logs store minimal text with redaction.
* Rate limit chat per IP/session; captcha fallback on abuse.
* Data processing note (privacy policy); cookie banner only if using non‑essential cookies.

### 3.14 AI Baseline Plan

**Service & Model (MVP recommendation)**

* Choose one high‑quality hosted model (e.g., Anthropic Claude 3.5 Sonnet **or** an OpenAI GPT‑4/4.*‑class model), with a second provider configured as fallback.
* Embeddings: widely supported model (e.g., text‑embedding family) stored in a vector DB (Supabase pgvector, Qdrant, or Pinecone).

**Integration Points**

* RAG for chat (global) + project‑scoped RAG on case study pages.
* Tool/function calling for “get_projects”, “get_project_by_slug”, “get_resume_summary”.

**Prompt Templates (MVP)**

* **System:** “You are the *mwm* portfolio assistant. Answer strictly from provided sources; cite inline with [n] linking to exact sections. If unsure, say so and suggest contacting.”
* **Developer:** JSON output schema for internal use (answer, citations[], safety flags).
* **User:** Raw question + optional page context + session history brief (last 2 turns).
* **Guardrails:** Refuse personal/PII requests; never invent employers, titles, or dates.

**RAG Spec**

* Chunking: 700–1,000 tokens, 10–15% overlap; metadata includes `docId`, `sectionId`, `sourceUrl`, `title`.
* Retrieval: top‑k 6 + MMR; re‑rank to 3–5 snippets; build a compact context window.
* Citation formatting: `[1]`…`[n]` mapping to sources rendered under the message.

**Fallbacks & Errors**

* Provider A failing → Provider B (shorter answer, still cited).
* Retrieval 0 hits → “I don’t have that in my sources” + contact CTA.

**Cost/Latency Controls**

* Stream tokens; compress history; cache answers for identical prompts; limit max answer tokens; nightly index compaction.

**Observability**

* Log: provider, latency, tokens, retrieved doc IDs (no full text); mark hallucination flags from QA prompts.

### 3.15 Technical Architecture (suggested)

* **Frontend:** Next.js (App Router) + React Server Components, Tailwind + Headless/primitive UI set; MDX for content.
* **Backend:** Edge/serverless functions for chat proxy & re‑index triggers.
* **Data:** Markdown/MDX in repo; vector DB (Supabase pgvector/Qdrant); lightweight KV (Vercel KV/Upstash) for sessions/rate limits.
* **Ingestion:** CLI script + route to re‑index; PDF resume processed to text with chunk attribution.
* **Analytics:** PostHog or Plausible (privacy‑friendly).
* **Email/Forms:** Resend/SendGrid (contact notifications).
* **Hosting:** Vercel/Netlify; CI with GitHub Actions.
* **Secrets:** .env; do not expose API keys to client; all AI calls proxied.

### 3.16 QA Plan (high level)

* Seed 25 canonical Qs with expected citation sets; nightly run.
* Lighthouse CI for performance budgets; axe-core for a11y.
* Rate limit tests; injection tests (prompt & markup).
* Manual “smoke” on re‑index flow each content update.

### 3.17 Risks & Mitigations

* **Hallucinations:** Strict RAG only; confidence threshold; UX emphasizes citations.
* **Token costs:** Caching + concise prompts + provider pricing checks.
* **Content freshness:** Visible “last indexed”; easy re‑index button.
* **Abuse/spam:** Rate limits + honeypot; captcha fallback.

### 3.18 Glossary

* **RAG:** Retrieval‑Augmented Generation; **Chunk:** text slice with embedding; **MMR:** Maximal Marginal Relevance; **p50/p95:** latency percentiles.

---

## 4) Deliverables for Cursor (copy/paste friendly)

**Repo structure**

```
/app
  /(dashboard)           # landing + cards + chat
  /projects
    /[slug]
  /about
  /contact
  /book
  /ai/how-it-works
  /api/chat              # serverless proxy to LLM
  /api/reindex           # kicks off ingestion
/components              # UI primitives
/content                 # MDX projects/case studies/resume
/lib
  embeddings.ts
  rag.ts
  prompts.ts
  analytics.ts
  rate-limit.ts
/scripts
  ingest.ts              # CLI to (re)index content
  pdf-to-text.ts
/tests
  chat.qa.spec.ts        # seeded QAs + citation checks
  perf.lighthouse.ci.js
```

**Environment (.env.example)**

```
AI_PROVIDER=anthropic|openai
AI_API_KEY=...
EMBEDDINGS_PROVIDER=...
VECTOR_DB_URL=...
VECTOR_DB_API_KEY=...
ANALYTICS_KEY=...
EMAIL_API_KEY=...
BOOKING_URL=https://...
SITE_URL=https://mwm.dev
```

**Function calling schema (server)**

```ts
type Tool =
  | { name: 'get_projects'; args: { filters?: { role?: string; skills?: string[]; year?: number } } }
  | { name: 'get_project_by_slug'; args: { slug: string } }
  | { name: 'get_resume_summary'; args: {} };
```

**Prompt snippet (system)**

```
You are the mwm portfolio assistant. Answer ONLY from the provided context.
Cite sources inline as [1], [2], … and list them after your answer with titles and links.
If the context is insufficient, say so and offer the contact option.
Keep answers concise unless asked for depth.
```

---