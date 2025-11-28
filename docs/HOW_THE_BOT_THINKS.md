# How the Bot Thinks: Prompt & Analysis System

**Last Updated:** November 2025  
**Status:** Production

## Overview

The bot uses a multi-stage analysis pipeline that routes questions, retrieves relevant context, analyzes question types, and constructs dynamic prompts before sending to Claude 3.5 Sonnet. This document explains the complete flow from user input to final response.

---

## 1. Question Analysis & Intent Routing

When a user asks a question or responds, the bot first analyzes the input to determine intent:

### Intent Detection (`functions/src/chat.ts:245-260`)

**Small Talk** (≤20 characters, matches greeting patterns):
- Patterns: `hi`, `hello`, `hey`, `how are you`, `thanks`, etc.
- **Action:** Returns random friendly greeting from 30+ pre-written responses
- **Bypass:** Skips RAG entirely, no LLM call

**Contact** (explicit hiring/contact requests):
- Patterns: `hire`, `availability`, `book`, `rates`, `contact`, `email`, `linkedin`, `cal.com`, `schedule`
- **Action:** Returns contact information + offer to highlight wins
- **Bypass:** Skips RAG entirely, no LLM call

**Deterministic Responses** (user says "yes" to prompts):
- Detects when user accepts: brag reel, leadership philosophy, or 90-day plan
- **Action:** Retrieves full pre-written document from `/content/responses/*.mdx`
- **Bypass:** Skips RAG and LLM entirely, returns content directly
- **Why:** Eliminates hallucination risk for high-frequency responses

**RAG (Default)**:
- All other questions proceed to full RAG pipeline

---

## 2. Query Expansion & Analysis

For RAG questions, the bot expands and analyzes the query:

### Query Expansion (`functions/src/retrieval.ts:144-211`)

The bot expands queries with:
- **Synonyms:** Maps terms like "northstar" → "north star", "time-to-insight", "TTI"
- **Acronyms:** Expands "CNS" → "Central Nervous System", "Multi-Agent Innovation Platform"
- **Project Names:** "TakeCost" → "AutoTake", "construction estimation"
- **Technology:** "AWS" → "Amazon Web Services", "Bedrock"
- **Context Terms:** Adds related terms for better retrieval

**Example:**
```
User: "Tell me about CNS"
Expanded: "Tell me about CNS Central Nervous System Multi-Agent Innovation Platform innovation platform innovation copilot CNS platform Swift Racks CNS"
```

### Question Type Detection (`functions/src/chat.ts:316-328`)

The bot analyzes question patterns to understand intent:

**Question Types Detected:**
- **Who/About Matt:** `who is`, `who's`, `about`, `bio`, `background`
- **Philosophy:** `philosophy`, `philosophies`, `approach`, `style`, `how do you think`
- **Achievement:** `achievement`, `best`, `biggest`, `greatest`, `win`, `accomplishment`
- **Project-Specific:** Detects mentions of CNS, AthleteAtlas, PaySight, EdPal, TakeCost, Schulich, AWS
- **Acronym:** Detects acronym questions (CNS, RAS, etc.)

**Why This Matters:** Different question types get different priority boosting and prompt guidance.

---

## 3. Retrieval & Priority Boosting

### Lexical Search (`functions/src/retrieval.ts:213-255`)

1. **Search:** FlexSearch returns top 24 candidates
2. **Fallback:** If no results, term-by-term search
3. **Reranking:** Currently placeholder (returns as-is, upgrade path to embeddings ready)

### Priority Boosting (`functions/src/chat.ts:329-358`)

Based on question type, the bot boosts relevant documents to the top:

**Priority Rules:**
- **Who/About Matt:** Boosts `resume`, `timeline`, `teaching` documents
- **Philosophy/Achievement:** Boosts `interview`, `qa`, `resume` documents
- **CNS Questions:** Boosts `cns`, `cns-ai-powered-innovation-platform` documents
- **Project-Specific:** Boosts matching project documents (AthleteAtlas, PaySight, etc.)
- **Schulich/Teaching:** Boosts `schulich`, `teaching`, `instructor` documents

**Result:** Top 6 chunks selected after priority boosting, with most relevant first.

---

## 4. Context Assembly

### Context Building (`functions/src/chat.ts:359-363`)

The bot assembles context from retrieved chunks:
- **Format:** `[1] (Title) snippet...`
- **Max Chunks:** 6 chunks
- **Snippet Length:** 400 characters max
- **Metadata:** Includes `title`, `sourceUrl`, `snippet`

**Example Context:**
```
[1] (CNS Platform) The CNS platform is a multi-agent innovation system that processes natural language inputs...
[2] (Swift Racks) At Swift Racks, I led the development of the CNS platform...
[3] (Product Philosophy) I focus on learning faster than risk compounds...
```

---

## 5. Persona Knowledge Fallback

### When Persona Knowledge is Used (`functions/src/chat.ts:379-397`)

The bot uses persona knowledge (static framework knowledge) when:
1. **No RAG context retrieved** AND
2. **Question matches framework keywords** OR
3. **Bot suggested this topic** in small talk responses

**Framework Topics:**
- North Star Metrics
- Product Philosophy
- Leadership Style
- Experimentation Approach
- Team Operating System
- Strategy Development
- Data & Decision Making
- Speed & Execution
- Pivots & Change Management

**Why:** Ensures the bot can answer framework questions even without retrieved context.

---

## 6. Tone Selection

### Tone Detection (`functions/src/tone.ts:18-37`)

The bot selects one of three tones:

**Narrative:**
- Triggered by: "how did you decide", "tell me the story", "what happened", "journey"
- Also: When user is on a project/case study page
- **Style:** Situation → insight → decision → result

**Personal:**
- Triggered by: Explicit requests like "personal story", "therapy", "mental health", "rage piece"
- **Gated:** Only if `allowPersonal` flag is enabled
- **Max Length:** 180 words
- **Style:** Reflective, compassionate, includes content note

**Professional (Default):**
- All other questions
- **Max Length:** 600 words
- **Style:** Concise, outcome-focused, confident

---

## 7. Prompt Construction

### System Prompt (`functions/src/prompts.ts:22-55`)

The system prompt includes:

**1. Company Whitelist (CRITICAL):**
```
You have ONLY worked at:
- Altima Ltd. (2008)
- Pixilink (2009-2010)
- Air Canada (2010-2018)
- RaceRocks 3D (2018-2024)
- Swift Racks (2024-Present)
- Schulich School of Business (2024-Present)
```

**2. Core Rules:**
- Answer from CONTEXT when available
- Use PERSONA KNOWLEDGE for frameworks when CONTEXT is thin
- First-person voice ("I")
- Never invent employers, dates, metrics
- Avoid generic refusals
- Default length ≤160 words (expand to 5-7 bullets for highlights)

**3. Tone Block:**
- Dynamic based on detected tone (professional/narrative/personal)

**4. Persona Knowledge Block:**
- Injected when needed (framework questions with no context)

### User Prompt (`functions/src/prompts.ts:93-142`)

The user prompt includes:

**1. Question Block:**
- User's trimmed question

**2. Context Block:**
- Numbered citations: `[1] (Title) snippet...`
- Max 6 chunks
- 400 char snippets

**3. Company Whitelist Reminder:**
- Repeated to prevent hallucinations

**4. Question-Type Specific Guidance:**
- **Philosophy:** "Reference interview Q&A or leadership philosophy sections"
- **Achievement:** "Reference major achievements sections. Include specific metrics"
- **Acronym:** "Explain what the acronym stands for, what it is, and its significance"
- **Project:** "Provide context about what the project is, the problem it solved, key features"

**5. History Block (Optional):**
- Last 2 conversation turns for context continuity

---

## 8. LLM Inference

### Bedrock Call (`functions/src/chat.ts:409-453`)

**Model:** `anthropic.claude-3-5-sonnet-20240620-v1:0`

**Configuration:**
- **Max Tokens:** 180 (personal), 600 (professional/narrative)
- **Temperature:** 0.1 (low for consistency)
- **Top-P:** 0.9

**Message Format:**
- System message: Full system prompt
- User messages: Historical turns + current user prompt
- Content format: `[{ text: string }]` (text-only)

**Streaming:**
- Server-Sent Events (SSE)
- Currently sends full answer in one chunk (not token-by-token)

---

## 9. Post-Processing

### Answer Processing (`functions/src/chat.ts:462-467`)

**1. Bullet Point Formatting:**
- Removes blank lines between bullets
- Keeps bullets tight: `• Point one\n• Point two`

### Hallucination Detection (`functions/src/chat.ts:468-511`)

**1. Fake Company Detection:**
- Blacklist: Quora, Course Hero, Airbnb, Reddit, Google, Meta, Amazon, Microsoft, etc.
- String matching on answer (case-insensitive)

**2. Known Fake Brag Pattern Detection:**
- Patterns like "led product at quora", "drove 300% revenue at course hero"
- Detects common hallucination patterns

**3. Automatic Correction:**
- If detected, replaces answer with corrected version
- Redirects to actual companies and roles
- Logs error for monitoring

### Citation Extraction (`functions/src/prompts.ts:144-165`)

**Process:**
1. Scans answer for `[n]` markers
2. Maps citation numbers to context chunks
3. Extracts `title` and `sourceUrl` for each citation
4. Returns unique citations (no duplicates)

---

## 10. Response Format

### SSE Response (`functions/src/chat.ts:229-243`)

**Format:**
```json
data: {"type": "chunk", "content": "answer text"}
data: {"type": "done", "citations": [...], "tone": "professional"}
```

**Citations:**
- Array of `{ title, sourceUrl }`
- Extracted from `[n]` markers in answer

**Tone:**
- Returns detected tone for analytics

---

## Complete Flow Diagram

```
User Question/Response
    ↓
[1] Intent Routing
    ├─ Small Talk? → Return greeting (bypass RAG/LLM)
    ├─ Contact? → Return contact info (bypass RAG/LLM)
    ├─ Deterministic? → Return pre-written doc (bypass RAG/LLM)
    └─ RAG → Continue
    ↓
[2] Query Expansion
    ├─ Add synonyms
    ├─ Expand acronyms
    ├─ Add project names
    └─ Add technology terms
    ↓
[3] Question Type Detection
    ├─ Who/About Matt?
    ├─ Philosophy?
    ├─ Achievement?
    ├─ Project-Specific?
    └─ Acronym?
    ↓
[4] Retrieval
    ├─ FlexSearch (top 24 candidates)
    ├─ Priority Boosting (based on question type)
    └─ Select top 6 chunks
    ↓
[5] Persona Knowledge Check
    ├─ No context retrieved?
    ├─ Framework question?
    └─ Bot suggested topic?
    → Inject persona knowledge if needed
    ↓
[6] Tone Selection
    ├─ Narrative? (story questions)
    ├─ Personal? (explicit requests, gated)
    └─ Professional? (default)
    ↓
[7] Prompt Construction
    ├─ System Prompt (company whitelist, rules, tone, persona)
    └─ User Prompt (question, context, history, guidance)
    ↓
[8] LLM Inference
    ├─ Claude 3.5 Sonnet
    ├─ Temperature: 0.1
    └─ Max tokens: 180-600
    ↓
[9] Post-Processing
    ├─ Format bullet points
    ├─ Hallucination detection
    ├─ Citation extraction
    └─ Automatic correction if needed
    ↓
[10] Response
    └─ SSE stream with answer, citations, tone
```

---

## Key Design Decisions

### Why Deterministic Responses?

**Problem:** LLM was hallucinating companies when users said "yes" to prompts like "Want a brag reel?"

**Solution:** Pre-written content files that bypass LLM entirely.

**Result:** Zero hallucination risk for high-frequency responses.

### Why Query Expansion?

**Problem:** Users might ask "CNS" but documents say "Central Nervous System".

**Solution:** Expand queries with synonyms, acronyms, and related terms.

**Result:** Better retrieval coverage.

### Why Priority Boosting?

**Problem:** Generic search might return irrelevant chunks first.

**Solution:** Boost documents based on question type (philosophy → interview docs, CNS → CNS docs).

**Result:** More relevant context at the top.

### Why Persona Knowledge Fallback?

**Problem:** Framework questions might not have retrieved context.

**Solution:** Static knowledge base always available for framework topics.

**Result:** Bot can answer framework questions even without retrieval.

### Why Multi-Layer Hallucination Prevention?

**Problem:** LLMs can invent companies, roles, metrics.

**Solution:** 
1. Company whitelist in prompt
2. Deterministic responses
3. Post-processing detection
4. Automatic correction

**Result:** Multiple safety nets catch hallucinations.

---

## Analytics & Monitoring

**Tracked Metrics:**
- Question type (philosophy, achievement, project-specific)
- Tone selected (professional, narrative, personal)
- Citation count
- Latency (p50, p95)
- Token usage (in/out)
- Hallucination detection events

**Logs:**
- Correlation ID for request tracking
- RAG metrics (candidate count, retrieval time)
- Hallucination events
- Error conditions

---

## Future Enhancements

**Planned:**
1. Token-by-token streaming (currently sends full answer)
2. Embedding-based reranking (currently placeholder)
3. Citation quality scoring
4. Conversation memory (persistent session storage)

**Considered:**
1. Vector database migration (Pinecone, Weaviate, Qdrant)
2. Multi-model fallback (Claude → GPT-4)
3. A/B testing framework for prompts

---

**Document Version:** 1.0  
**Last Updated:** November 2025  
**Next Review:** Q1 2026

