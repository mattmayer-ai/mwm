# Cursor Kickoff Prompt Pack — mwm

This document contains copy-paste-ready prompts for using Cursor to build the **mwm** AI-driven portfolio site according to the Swift CNS Innovation Playbook.

**Source of Truth:** `/docs/prd.md` — Read this first for complete requirements, user stories, and technical specifications.

---

## What the Playbook Says You Need (and How We Comply)

* **PRD completeness & AI Baseline:** Include clear sections (Purpose, Scope, Personas, Journeys, Functional/Non‑Functional Reqs, IA/Data, Acceptance Criteria, Analytics, Accessibility, Security, Glossary). Your PRD already follows this; we'll point Cursor at `/docs/prd.md`. ([Swift CNS][1])

* **.cursorrules is critical** to steer Cursor (coding standards, stack conventions, accessibility/perf/security rules). We'll reference the file at repo root and keep rules MVP‑first and typed. ([Swift CNS][2])

* **Plan Mode:** Provide PRD + (mockups when ready) + a **foundation tech stack**; ask for a phased plan with dependencies and MVP focus; review/approve before building. ([Swift CNS][3])

* **Template content for rules:** Core principles (MVP first, quality, type safety), code quality, org structure, accessibility/security—our `.cursorrules` reflects this. ([Swift CNS][4])

* **Build Features:** After plan approval, collaborate iteratively; keep `npm run dev` running; test continuously; use Cursor's plan function to fix issues. ([Swift CNS][5])

* **Git & Cursor setup:** Ensure repo is cloned and ready before invoking the rules/plan steps. ([Swift CNS][6])

---

## Pre‑flight Checklist

Paste this into Cursor if you want it to self‑verify before starting:

```
Pre-flight checklist for mwm development:

- [ ] Repo opened in Cursor; `git status` clean. ([Swift CNS][6])
- [ ] `/docs/prd.md` exists and is the current source of truth. ([Swift CNS][1])
- [ ] `/.cursorrules` present at repo root (MVP‑first, typed, a11y, perf, security). ([Swift CNS][2])
- [ ] QA harness present: `tests/chat.qa.spec.ts`, `tests/qa/qa-seed.json` (citations‑based checks).
- [ ] Initial content present under `/content` and resume pdf under `/public/resume`.
- [ ] Node 20 LTS; package manager configured (npm/pnpm).
- [ ] Firebase project initialized; Functions, Firestore, Hosting configured.
- [ ] Environment variables stubbed in `.env.example` (Firebase config, Anthropic key, ADMIN_EMAIL, LOGROCKET_ID).
```

---

## Cursor Kickoff (Plan Mode)

**Copy/paste into a new Cursor chat:**

```
You are planning and building my AI-driven portfolio "mwm".

Read these files first:

- /docs/prd.md        # Source of truth (Purpose, Scope, Personas, Journeys, FR/NFR, IA/Data, Acceptance, Analytics, A11y, Security)

- /.cursorrules       # Coding standards, MVP guardrails, accessibility/perf/security rules

- /tests/chat.qa.spec.ts and /tests/qa/qa-seed.json  # Eval harness

- /content/**         # MDX projects + resume content

- /public/resume/mwm-resume.pdf

Context:

- The PRD defines MUST stories U1–U8 (RAG chat with citations, projects directory, case study pages, resume, contact/booking, ingestion, analytics, trust UI) and SHOULD: dark mode.

- Architecture: React 19 + Vite 7.7 (SPA), TypeScript (strict), Firebase Functions for API, Firestore + Cloud Storage for data/lexical index, Firebase Hosting for deploy, Anthropic Claude for AI. All AI calls are server-side via Functions.

Your task (PLAN MODE ONLY — do not write code yet):

1) Produce an IMPLEMENTATION PLAN with 4 phases and explicit dependencies:

   - Phase 0: Repo hygiene + CI (ESLint/Prettier, TS strict, Lighthouse/axe runners).

   - Phase 1: Content ingestion & RAG infrastructure (chunking, embeddings, vector store, reindex route/CLI).

   - Phase 2: /api/chat with citations + dashboard/projects/resume/contact pages + theming (dark mode).

   - Phase 3: Analytics wiring, trust UI, performance hardening, a11y, QA, and release prep.

2) For each task:

   - Inputs/outputs, acceptance criteria tied to PRD.

   - Measurable perf targets: chat p50 ≤ 3s, p95 ≤ 6s; LCP ≤ 2.5s; a11y WCAG 2.2 AA.

   - Risks + mitigations (hallucinations, cost, abuse).

3) Foundation Tech Stack (tailored to PRD):

   - Runtime: Node 20 LTS

   - Framework: React 19 + Vite 7.7, TypeScript 5.9.3 strict, React Router DOM 7.4, Zustand 5.8

   - Styling/UI: Tailwind CSS 3.3.6 + Radix UI primitives (Dialog, Dropdown Menu, Select, Label, Slot, Tabs, Toast), Lucide + Heroicons

   - Backend: Firebase 12.4.0 (Firestore, Cloud Functions, Hosting, Auth)

   - Data: MDX/Markdown content; Firestore for chunks/metadata; Cloud Storage for lexical index (FlexSearch/Lunr); upgrade path to embeddings later

   - Analytics: LogRocket 10.1.0; Firestore for event logging

   - Email: Cloud Functions email trigger or Firestore collection + manual follow-up

   - Test: Vitest + Playwright (optional later)

   - Lint/format: ESLint/Prettier

   - AI: Anthropic SDK 0.67.0 (Claude 3.5 Sonnet) via Firebase Functions

4) Deliverables in this message:

   - A bullet "Plan Overview" (phases with 1–2 line summaries).

   - A table of tasks with: Phase, Task, Depends On, Estimate (S/M/L), Acceptance Criteria.

   - A file/folder scaffolding proposal matching the PRD.

   - A short "Open Questions" list requiring my decision, if any.

Constraints & Rules:

- Adhere strictly to /.cursorrules and the PRD. Plan only—no code until I approve.

- Keep scope to MVP; note any "Could Have" as backlog, not in plan's critical path.

- After the plan, STOP and wait for my approval. I will reply with "APPROVE PLAN" or request changes.
```

**Why this matches the playbook:** Plan Mode must include PRD + stack + a request for a comprehensive plan with dependencies and MVP focus before building. ([Swift CNS][3])

---

## After You Approve the Plan — Cursor Build Prompt

**Copy/paste after plan approval:**

```
APPROVED: Build Phase 0 → Phase 3 in order. For each phase:

- Summarize intended changes and create commits per logical unit.

- Keep AI calls strictly server-side; never expose keys.

- Respect accessibility and performance budgets in the PRD.

- After each major step, run: 

  - unit/integration tests (if present),

  - Lighthouse CI + axe checks,

  - our QA harness: `pnpm vitest --run tests/chat.qa.spec.ts`.

- If a requirement is ambiguous, ask one targeted question, then proceed with the simplest compliant solution.

Phase 0 specifics:

- Initialize Vite + React 19 + TS strict; Tailwind; Radix; icon libs; Zustand; React Router.

- Configure Firebase project; add Functions (Node 20), Firestore, Hosting; set Hosting rewrites to `/api/*` → Functions.

- Add ESLint/Prettier + TS strict config; CI scripts for lint + typecheck.

- Add Lighthouse/axe CI runners.

- Create `.env.example` (Firebase config, Anthropic key, ADMIN_EMAIL, LOGROCKET_ID).

Phase 1 specifics:

- Implement `/scripts/ingest.ts` (MDX + resume pdf → chunks → lexical index) with configurable window/overlap and metadata {docId, sectionId, sourceUrl, title}.

- Store chunks in Firestore; persist lexical index (FlexSearch/Lunr) to Cloud Storage.

- Add Firebase Function `POST /api/reindex` (owner-only trigger via Auth email or admin secret).

Phase 2 specifics:

- Implement Firebase Function `POST /api/chat` with lexical retrieval → top-K → re-rank to 3–5 snippets, and inline citations `[n]` with slug/sourceUrl.

- Build UI: dashboard, projects list (filters), project detail, resume (PDF download), contact/booking, dark mode.

- Add "How it works" modal with last indexed timestamp and model/provider info.

Phase 3 specifics:

- Analytics events to Firestore: page_view, chat_start, chat_message, citation_click, contact_submit, resume_download.

- Rate limiting & spam protection; error states; perf tuning.

- Final QA: ≥80% seeded QA pass (citations present); a11y and perf budgets.

STOP after Phase 3 with a summary and remaining todos/backlog.
```

**Why this matches the playbook:** Build after plan approval, collaborate iteratively, keep dev server/tests running, and refine with Cursor as issues surface. ([Swift CNS][5])

---

## Optional: "Fix/Improve" Prompt Template

**For iterative passes after initial build:**

```
Here are issues found during testing (env running with `npm run dev`):

1) [component/page] expected vs actual

2) [performance/a11y] expected vs actual

3) [RAG/citations] expected vs actual (missing or wrong citations)

Create a short plan to fix in ≤ N tasks, respecting PRD + .cursorrules. Then execute and show diffs.
```

This mirrors the "use planning for fixes" guidance. ([Swift CNS][5])

---

## Foundation Tech Stack Block

**Standalone pasteable specification (use in Plan Mode if Cursor asks):**

```
Foundation Tech Stack — mwm

- Node 20 LTS
- React 19 + Vite 7.7, TypeScript 5.9.3 strict
- React Router DOM 7.4, Zustand 5.8
- Tailwind CSS 3.3.6 + Radix UI primitives (Dialog, Dropdown Menu, Select, Label, Slot, Tabs, Toast)
- Lucide + Heroicons for icons
- Firebase 12.4.0 (Firestore, Cloud Functions, Hosting, Auth)
- Content: MDX/Markdown in /content, resume PDF in /public/resume
- Data: Firestore for chunks/metadata; Cloud Storage for lexical index (FlexSearch/Lunr)
- AI Provider: Anthropic SDK 0.67.0 (Claude 3.5 Sonnet) via Firebase Functions
- Server: Firebase Functions (HTTPS) for /api/chat and /api/reindex
- Testing: Vitest; (optional later: Playwright)
- Analytics: LogRocket 10.1.0; Firestore for event logging
- Email: Cloud Functions email trigger or Firestore collection
- Tooling: ESLint, Prettier, Lighthouse CI, axe-core, PostCSS, Autoprefixer, ESBuild (via Vite)
```

**Playbook note:** You're expected to **provide** a stack spec when generating the plan—this is ours, customized for React/Vite/Firebase with lexical search (upgrade path to embeddings later). ([Swift CNS][3])

---

## Crosswalk: Our `.cursorrules` vs Template

* **Core principles**: MVP-first, quality, type safety → matches template. ([Swift CNS][4])
* **Code quality/organization**: strict TS, small components, explicit error states → matches template guidance. ([Swift CNS][4])
* **Accessibility & Security**: semantic HTML, WCAG AA, no secrets in client → matches template. ([Swift CNS][4])
* **Stack conventions**: We use **React 19 + Vite + Firebase** (SPA with Firebase Functions for server-side logic) instead of Next.js; lexical search for MVP with upgrade path to embeddings. ([Swift CNS][2])

---

## Quick Reference (TL;DR)

**What to paste first:**

1. Start a new Cursor chat → paste **"Cursor Kickoff (Plan Mode)"** section above.
2. Review the plan Cursor returns; ask for tweaks; then reply **"APPROVE PLAN"**.
3. Paste **"After You Approve the Plan — Cursor Build Prompt"** section above.

If you want, you can also produce a one‑file `IMPLEMENTATION_PLAN.md` skeleton you can hand‑edit during Plan Mode approval, but the prompts above are enough to kick off development per the playbook.

---

## References

[1]: https://swiftcns.gitbook.io/innovation-playbook/index-2/05-planning/05-planning-prd "05 — Planning: PRD & AI Baseline | Swift Racks - Innovation Playbook"

[2]: https://swiftcns.gitbook.io/innovation-playbook/index-2/06-setup/06-setup-cursorrules "06 — Setup: .cursorrules | Swift Racks - Innovation Playbook"

[3]: https://swiftcns.gitbook.io/innovation-playbook/index-2/06-setup/06-setup-implementation-planning "06 — Setup: Implementation Planning | Swift Racks - Innovation Playbook"

[4]: https://swiftcns.gitbook.io/innovation-playbook/index-2/06-setup/05-setup-cursorrules-template ".cursorrules Template | Swift Racks - Innovation Playbook"

[5]: https://swiftcns.gitbook.io/innovation-playbook/index-2/08-build-features "08 — Build Features | Swift Racks - Innovation Playbook"

[6]: https://swiftcns.gitbook.io/innovation-playbook/index-2/06-setup/06-setup-git-cursor "06 — Setup: Git & Cursor | Swift Racks - Innovation Playbook"

