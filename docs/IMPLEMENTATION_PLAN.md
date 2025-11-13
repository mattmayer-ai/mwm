# Implementation Plan — mwm (AI-Driven Portfolio)

**Status:** Planning → Ready for Execution  
**Last Updated:** 2025-01-27  
**Stack:** React 19 + Vite 7.7 + Firebase 12.4.0 + Anthropic Claude 3.5

---

## 0) Architecture at a Glance

**Decisions that keep us in-scope:**

* **App**: React 19, TypeScript 5.9.3, **Vite 7.7** SPA; **React Router DOM 7.4** for routing; **Zustand 5.8** for app state.

* **UI**: Tailwind CSS 3.3.6 + **Radix UI** (Dialog, Dropdown Menu, Select, Label, Slot, Tabs, Toast); **Lucide** + **Heroicons**.

* **Backend**: **Firebase 12.4.0** — Authentication (owner/admin only), **Cloud Firestore** for content/chunks/telemetry, **Firebase Hosting** for deploy, **Cloud Functions (HTTPS)** for `/api/*`.

* **RAG (MVP, no extra infra)**:
  * Ingestion produces **text chunks** with rich metadata and a **lexical index** (e.g., FlexSearch/Lunr) persisted to **Cloud Storage**; chunks + metadata stored in **Firestore**.
  * Retrieval uses **lexical search → K candidates → simple re‑rank** (e.g., term overlap + section title boost). This avoids adding a separate vector DB while your content set is small; upgrade path to embeddings later without changing calling code.

* **AI**: **Anthropic SDK 0.67.0** (Claude) for generation. Server‑side proxy in Functions.

* **Monitoring**: **LogRocket 10.1.0**; minimal server logs (latency, token counts, docIds).

* **Dev tooling**: PostCSS, Autoprefixer, ESBuild (via Vite).

* **Security**: All AI keys server‑side; rate‑limit chat; owner‑only reindex; no PII in logs.

> **Rationale**: Meets MVP without over‑engineering (no extra servers/dbs), and leaves a clean seam to swap lexical → vector retrieval later.

---

## 1) Phase Plan (Priority-Driven, Minimal Dependencies)

### **Phase 0 — Project Setup & Hygiene (Day 0–0.5)**

**Goals:** Repo hygiene, toolchain, Firebase wiring, `.cursorrules` alignment.

**Tasks:**

* **P0.1** Initialize Vite + React 19 + TS strict; Tailwind; Radix; icon libs; Zustand; routing.
* **P0.2** Configure Firebase project; add Functions (Node 20), Firestore, Hosting; set Hosting rewrites to `/api/*` → Functions.
* **P0.3** Create `.env.example` (Firebase config, Anthropic key, ADMIN_EMAIL, LOGROCKET_ID).
* **P0.4** Wire **LogRocket** (client) + server logging util (latency/tokens/errors).
* **P0.5** **.cursorrules** sanity pass (adjust for React/Vite/Firebase conventions if needed); commit.
* **P0.6** CI basics: typecheck, lint, unit tests scaffold (Vitest), build.

**Exit Criteria:** `vite dev` runs, Firebase emulators run, Functions deploys hello‑world, `.cursorrules` recognized.

---

### **Phase 1 — Content Ingestion Pipeline (FR6) + Admin Trigger (High Priority)**

**Goals:** Make all content indexable with citations; owner can reindex on demand.

**Tasks:**

* **P1.1** **Content schema & parser**
  * Define MDX/Markdown frontmatter types (`Project`, `CaseStudy`, `Resume`).
  * Build `scripts/ingest.ts`: parse `/content/**`, sectionize (Context/Problem/Approach/Outcomes/Learnings).

* **P1.2** **Chunker & storage**
  * Chunk 700–1000 tokens, 10–15% overlap.
  * Store `chunks` in Firestore: `{docId, sectionId, title, sourceUrl, text, createdAt}`.

* **P1.3** **Lexical index**
  * Build in Node (FlexSearch/Lunr). Persist serialized index to Cloud Storage `indexes/primary.json`.
  * Record index metadata (version, lastIndexedAt) in Firestore `meta/index`.

* **P1.4** **Reindex API**
  * Cloud Function `POST /api/reindex` → runs ingestion + index build.
  * AuthZ: Only **owner** (match `auth.token.email === ADMIN_EMAIL`) or `X-Admin-Secret`.

* **P1.5** **Owner UI**
  * Minimal admin panel: "Reindex" button + lastIndexedAt + progress toasts.

**Exit Criteria:** Reindex completes locally + deployed; Firestore has chunks; Storage has index; lastIndexedAt visible in admin UI and "How it works".

---

### **Phase 2 — AI Chat with Citations (FR1) (Highest Priority alongside FR6)**

**Goals:** Answer strictly from site content with **inline citations**, fast and safe.

**Tasks:**

* **P2.1** **Retrieval service (server)**
  * Function `retrieveCandidates(query)` reads `indexes/primary.json` from Storage, returns top‑K chunk IDs; fetch chunk docs from Firestore; simple re‑rank.

* **P2.2** **Chat endpoint** (`POST /api/chat`)
  * Input `{messages:[...], scope?: docId}` (scope when chatting on a case study page).
  * Build compact context from top 3–5 chunks; **system prompt**: "Answer only from sources; cite [1],[2]…; if insufficient, say so + contact CTA."
  * Call **Anthropic SDK** server‑side; stream tokens; return `{ answer_md, citations:[{title, slug|sourceUrl}] }`.
  * Rate‑limit per IP; guardrail for personal/PII questions.

* **P2.3** **Chat UI**
  * Floating/side panel (Radix Dialog + Tabs for Q&A/History), streaming rendering, **clickable citations** that deep‑link to sections.

* **P2.4** **Eval & hardening**
  * Run `vitest` QA seeds; iterate until ≥ **80%** include at least one expected citation.
  * Log p50/p95 latency; assert p50 ≤ 3s, p95 ≤ 6s.

**Exit Criteria:** Seed QA threshold met; answers always show 2–4 citations when context exists; refusals are graceful when not.

---

### **Phase 3 — Projects Directory & Case Study Pages (FR2–FR3)**

**Goals:** Browsable work with filters + deep pages that showcase outcomes; "Ask AI about this project."

**Tasks:**

* **P3.1** **Routes & layout**
  * `/` dashboard (hero + top projects + chat entry).
  * `/projects` grid with filters (role, industry, skills, year); URL sync; empty/skeleton states.
  * `/projects/:slug` case study template (Context, Constraints, Process, Decisions, Outcomes, Artifacts).

* **P3.2** **Filters**
  * Zustand store for filters; persist to query params; 200ms update budget.

* **P3.3** **"Ask AI"**
  * Pass `scope=docId` to `/api/chat` for project‑scoped retrieval bias.

* **P3.4** **Perf & a11y**
  * LCP ≤ 2.5s; keyboard navigation; Radix semantics respected.

**Exit Criteria:** Filtered grids, deep pages, and project‑scoped chat working end‑to‑end.

---

### **Phase 4 — Resume/About, Contact/Booking, Trust UI, Theming (FR4–FR5–FR8–FR9)**

**Goals:** Hiring‑ready polish.

**Tasks:**

* **P4.1** **Resume/About** page + **PDF download**; add JSON‑LD (Person/CreativeWork).
* **P4.2** **Contact** form (Radix Dialog + Toast). Spam honeypot + simple rate limit; email via Cloud Function (or Firestore collection + email trigger). **/book** links to Calendly/Cal.com.
* **P4.3** **Trust & transparency** modal ("How the AI works"): sources listed; model/provider; lastIndexedAt; privacy note.
* **P4.4** **Dark mode** (prefers‑color‑scheme + toggle persisted in Zustand).

**Exit Criteria:** Recruiter‑friendly flow complete: quick read, download resume, contact/booking, and clear AI transparency.

---

### **Phase 5 — Analytics/Monitoring, Quality Gates & Deploy (FR7)**

**Goals:** Insights without adding new vendors; stable prod.

**Tasks:**

* **P5.1** **Event logging** to Firestore: `page_view`, `chat_start`, `chat_message`, `citation_click`, `contact_submit`, `resume_download`.
  * Session ID: short hash in localStorage (no PII).

* **P5.2** **Owner dashboard** (basic counts & trends).

* **P5.3** **Monitoring**: LogRocket wired; server logs (latency/tokens/retrieval hits).

* **P5.4** **QA pass**: vitest seeds, a11y (axe), perf (Lighthouse) via `npm scripts`.

* **P5.5** **Firebase Hosting deploy** with rewrites to Functions; cache headers for static assets.

**Exit Criteria:** Deployed MVP with monitoring and minimal analytics; DoD met.

---

## 2) Task Breakdown & Dependencies

| ID       | Task                                           | Depends    | Output                                          | Acceptance (measurable)                               |
| -------- | ---------------------------------------------- | ---------- | ----------------------------------------------- | ----------------------------------------------------- |
| P0.1     | Vite/React/TS/Tailwind/Radix/Zustand scaffold  | –          | `vite` app; Tailwind config; Radix provider     | `vite dev` runs; TS strict; baseline pages render     |
| P0.2     | Firebase setup (Functions, Firestore, Hosting) | P0.1       | `/functions`, `firebase.json`, hosting rewrites | Functions deploys hello-world; emulators work         |
| P0.3     | Env + secrets layout                           | P0.1       | `.env.example`, `.env.local`                    | Build & Functions read env; no secrets in client      |
| P0.4     | LogRocket + server logging                     | P0.2       | Client init; server util                         | Logs appear in LogRocket; server logs structured     |
| P0.5     | `.cursorrules` React/Vite alignment            | –          | Updated rules committed                         | Cursor adheres; trial component matches rules         |
| P0.6     | CI basics (typecheck, lint, test, build)       | P0.1       | CI scripts                                      | All checks pass in CI                                  |
| **P1.1** | Content parser (MDX/Markdown)                  | P0.*       | `/scripts/ingest.ts`                            | Parses `/content/**` with frontmatter → objects       |
| **P1.2** | Chunking & Firestore write                     | P1.1       | `chunks` collection                             | Chunks exist w/ `{docId, sectionId, sourceUrl, text}` |
| **P1.3** | Lexical index build & persist                  | P1.1       | `indexes/primary.json` in Storage; meta doc     | Can load index and search locally in Node             |
| **P1.4** | Reindex Cloud Function (admin‑only)            | P1.2–P1.3  | `POST /api/reindex`                             | 200 OK; `lastIndexedAt` updates; secured              |
| **P1.5** | Owner UI (reindex button + status)            | P1.4       | Admin panel component                           | Button triggers reindex; shows lastIndexedAt         |
| **P2.1** | Retrieval service (server)                     | P1.3       | util to search index + fetch chunks             | Top‑K returns correct chunk IDs with scores           |
| **P2.2** | `/api/chat` (Claude, citations)                | P2.1       | Function w/ SSE/JSON; server‑only               | p50 ≤ 3s/p95 ≤ 6s; 2–4 citations or refusal           |
| **P2.3** | Chat UI (streaming + citations)                | P2.2       | Components in `features/chat`                   | Clickable citations deep‑link to sections             |
| **P2.4** | Eval hardening (vitest QA)                     | P2.2–P2.3  | Passing seed suite                              | ≥80% items include ≥1 expected citation               |
| **P3.1** | Routes `/`, `/projects`, `/projects/:slug`     | P0.*       | Router, layouts                                 | URLs render; skeleton and empty states included       |
| **P3.2** | Filters + URL sync                             | P3.1       | Zustand store, hooks                            | Filters update <200ms; back/forward preserved         |
| **P3.3** | Ask‑AI (scoped retrieval)                       | P2.2, P3.1 | Chip + scope param                              | Project‑scoped answers cite that project              |
| **P3.4** | Perf & a11y (LCP, keyboard nav)                 | P3.1       | Optimizations, ARIA                             | LCP ≤2.5s; keyboard nav works                          |
| **P4.1** | Resume/About + PDF download                    | P0.*       | Pages + JSON‑LD                                 | PDF ≤1MB; JSON‑LD valid                               |
| **P4.2** | Contact & booking                              | P0.2       | Form + email/Firestore                          | Valid submission; rate‑limit; success toast           |
| **P4.3** | Trust modal                                    | P1.4       | Modal + meta read                               | Shows lastIndexedAt, model/provider, sources          |
| **P4.4** | Dark mode                                      | P0.*       | Theme provider/store                            | Toggle persists; respects system pref                 |
| **P5.1** | Firestore analytics events                     | P0.2       | Event writer/util                               | Events logged; simple queryable dashboard             |
| **P5.2** | Owner dashboard                                | P5.1       | Dashboard page                                  | Shows counts/trends for last 30/90 days               |
| **P5.3** | Monitoring (LogRocket + server logs)           | P0.4       | Enhanced logging                                | Latency/tokens/errors visible                          |
| **P5.4** | QA/perf/a11y gates                            | All        | CI scripts                                      | Lighthouse LCP ≤2.5s; axe passes; seeds pass          |
| **P5.5** | Firebase Hosting deploy                        | All        | Deployed site                                   | Site live; rewrites work; cache headers set           |

---

## 3) File & Folder Scaffold (Vite + React Router)

```
/src
  /app
    /providers (theme, router, logrocket)
    /routes
      /home
      /projects
        index.tsx
        [slug].tsx
      /about
      /contact
      /ai/how-it-works
      /book
    /components (ui primitives wrapped from Radix + app-specific)
  /features
    /chat (api client, components, state)
    /projects (cards, filters, services)
    /admin (reindex panel)
  /lib
    content.ts      # local MD/MDX helpers (if needed)
    firestore.ts    # typed Firestore accessors
    retrieval.ts    # index load + candidate fetch + re-rank
    prompts.ts      # Claude system/user prompt builders
    analytics.ts    # event logger (Firestore)
    rateLimit.ts    # simple IP/session rate limiting
  main.tsx
  index.css

/scripts
  ingest.ts         # parses content, chunks, builds lexical index

/functions
  src/chat.ts       # POST /api/chat (Claude proxy + RAG)
  src/reindex.ts    # POST /api/reindex (admin-only)
  src/email.ts      # contact submission (optional email)

/content
  projects/*.mdx
  resume/resume.md

/public
  resume/mwm-resume.pdf

/tests
  chat.qa.spec.ts
  qa/qa-seed.json

/docs
  prd.md
  IMPLEMENTATION_PLAN.md
  cursor-kickoff.md
```

---

## 4) Acceptance Criteria (per FR)

* **FR1 Chat + citations**: Answers **only** from sources; 2–4 inline citations; refusal path when insufficient; p50 ≤ 3s, p95 ≤ 6s; ≥80% QA seeds pass.

* **FR2 Directory**: Filter by role/industry/skills/year; URL deep‑linking; 6+ cards < 1s desktop; empty/skeleton states.

* **FR3 Case study**: Structured sections; "Ask AI" scopes retrieval to docId.

* **FR4 Resume/About**: One‑page resume view + valid JSON‑LD; PDF ≤1MB.

* **FR5 Contact/Booking**: Validations; spam trap; rate‑limit; success feedback; booking link.

* **FR6 Ingestion**: Reindex produces chunks + index; lastIndexedAt visible; admin‑only.

* **FR7 Analytics**: Events logged (page_view, chat_start, chat_message, citation_click, contact_submit, resume_download); owner dashboard shows counts/trends.

* **FR8 Trust UI**: "How it works" modal lists sources, provider, lastIndexedAt, privacy note.

* **FR9 Theming**: System default + toggle persisted; Radix components accessible.

---

## 5) Risks & Mitigations

* **No vector DB (by design):** start with lexical + simple re‑rank; keep a retrieval interface so we can swap in embeddings later with no breaking changes.

* **LLM hallucinations:** strict system prompt; require citations; enable "insufficient context" fallback; QA seeds in CI.

* **Cold start / latency:** warm Functions during business hours; cache index in memory; stream responses.

* **Abuse/spam:** per‑IP rate limit; honeypot on contact; Cloud Armor (if needed later).

* **Costs:** cap max tokens; truncate history; cache index; keep chunk count modest.

---

## 6) Environment Variables (`.env.example`)

```bash
# Firebase (client)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_LOGROCKET_APP_ID=

# Server (Functions) — set via Firebase config / secrets
ANTHROPIC_API_KEY=
ADMIN_EMAIL=
RATE_LIMIT_MAX_PER_MIN=30
```

---

## 7) Open Questions (Answer Once, Then Encode in `.cursorrules` & Plan)

1. Do you want owner auth via **Firebase Auth email** or an **admin secret** on `/api/reindex` (or both)?
2. Confirm you're okay with **lexical retrieval** for MVP (no embeddings) given the small corpus.
3. Contact form: email via a provider (e.g., Gmail/SendGrid) or log to Firestore + follow‑up manually?
4. Any **must‑have metrics** beyond the PRD list for the owner dashboard?

---

## 8) Day‑1 Checklist (Approve Plan → Build)

* [ ] Plan doc created & reviewed; scope matches PRD; dependencies sane
* [ ] `.cursorrules` reflects **React/Vite/Firebase** conventions
* [ ] Emulators running; Functions deploy succeeds
* [ ] Start with **Phase 1 + 2** (reindex + chat) and run **QA seeds** until passing
* [ ] Then move to projects + case studies; then resume/contact/trust/theming; then analytics/monitoring

---

## 9) Progress Tracking

**Phase 0:** ⬜ Not Started  
**Phase 1:** ⬜ Not Started  
**Phase 2:** ⬜ Not Started  
**Phase 3:** ⬜ Not Started  
**Phase 4:** ⬜ Not Started  
**Phase 5:** ⬜ Not Started

---

**Next Steps:** Begin Phase 0 (Project Setup & Hygiene) when ready.

