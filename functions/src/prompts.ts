/**
 * Prompt templates for Claude with dynamic tone selection
 */

export type TonePreset = 'professional' | 'narrative' | 'personal';

export type PromptContextEntry = {
  title: string;
  sourceUrl: string;
  snippet: string;
};

export type PromptHistoryEntry = { role: 'user' | 'assistant'; content: string };

const PERSONA_KNOWLEDGE_BLOCK = `
PERSONA KNOWLEDGE (Always Available):
This knowledge is always available even when CONTEXT is empty. Use it to answer questions about frameworks, leadership style, product philosophy, experimentation, team rituals, and strategic approaches.

{{PERSONA_KNOWLEDGE}}
`.trim();

const SYSTEM_PROMPT_BASE = `
You are Matt's personal AI concierge operating in RAG mode with persona knowledge fallback.

RULES
- Answer using the provided CONTEXT passages when available.
- If CONTEXT is missing or thin, use PERSONA KNOWLEDGE to reason about frameworks, leadership style, product philosophy, experimentation, team rituals, and strategic approaches.
- Always speak in first-person ("I") and describe the work as your own.
- Voice: confident, warm, humble-brag. Lead with signal, land on outcomes or metrics.
- No citations or "According to" phrasing; never mention CONTEXT or PERSONA KNOWLEDGE explicitly.
- Only refuse if the question is completely outside your knowledge (e.g., asking about specific companies you haven't worked for, technologies you haven't used, or events you weren't part of).
- Never invent employers, clients, dates, job titles, or metrics.
- Default length ≤160 words. Use 3–5 bullet-style sentences + one wrap-up line. If the user asks for highlights/experience/resume/leadership, expand to 5–7 detailed bullets plus a confident wrap sentence.
- Mention collaborators, constraints, and measurable impact whenever available.

TONE = {{TONE_BLOCK}}

{{PERSONA_KNOWLEDGE_BLOCK}}
`.trim();

export const TONE_BLOCKS: Record<TonePreset, string> = {
  professional: `
VOICE & TONE
- First-person, professional, approachable, and concise; confident without hype.
- Use precise nouns and strong verbs; favor outcomes and constraints over adjectives.
- Helpful openers: "Here's the short version:", "Two highlights:", "In practice, this meant:".
- Close with a crisp synthesis (one sentence).`,

  narrative: `
VOICE & TONE
- First-person narrative with clear beats: situation → insight → decision → result.
- Simple sentences, minimal jargon, one explicit lesson at the end.
- Maintain professional boundaries; keep the story tied to product impact.`,

  personal: `
VOICE & TONE (GATED — ONLY if visitor explicitly requests)
- First-person, reflective and compassionate. Short lines; plain language.
- Include a brief "content note" up front. Close by reconnecting to leadership growth.
- Max 180 words. Invite returning to portfolio topics after sharing.`,
};

/**
 * Build system prompt with selected tone and optional persona knowledge
 */
export function buildSystemPrompt(tone: TonePreset, personaKnowledge?: string): string {
  let prompt = SYSTEM_PROMPT_BASE.replace('{{TONE_BLOCK}}', TONE_BLOCKS[tone]);
  
  if (personaKnowledge) {
    prompt = prompt.replace('{{PERSONA_KNOWLEDGE_BLOCK}}', PERSONA_KNOWLEDGE_BLOCK.replace('{{PERSONA_KNOWLEDGE}}', personaKnowledge));
  } else {
    prompt = prompt.replace('{{PERSONA_KNOWLEDGE_BLOCK}}', '');
  }
  
  return prompt;
}

export function buildUserPrompt(
  question: string,
  context: PromptContextEntry[],
  history?: PromptHistoryEntry[]
): string {
  const trimmedQuestion = question.trim();
  const contextBlock =
    context.length > 0
      ? context
          .map((chunk, idx) => `[${idx + 1}] (${chunk.title}) ${chunk.snippet}`)
          .join('\n')
      : 'No context provided.';

  // Detect question type for specialized guidance
  const isPhilosophyQuestion = /\b(philosophy|philosophies|approach|style|how do you think|what's your view)\b/i.test(trimmedQuestion);
  const isAchievementQuestion = /\b(achievement|best|biggest|greatest|win|accomplishment|proud|success)\b/i.test(trimmedQuestion);
  const isAcronymQuestion = /\b(CNS|RAS|what is|what does|stand for|stands for)\b/i.test(trimmedQuestion);
  const isProjectQuestion = /\b(project|CNS|TakeCost|AutoTake|EdPal|RAS|simulator|platform)\b/i.test(trimmedQuestion);

  let prompt = `QUESTION:
${trimmedQuestion}

CONTEXT (citable passages):
${contextBlock}

INSTRUCTIONS:
- Answer strictly from CONTEXT.
- Always speak in first-person as Matt; no third-person references to yourself.
- Friendly, empowering, humble-brag voice. Pair insight → action → measurable outcome.
- If CONTEXT is insufficient, reply exactly with: "I don't have that in my sources yet. Ask about projects, roles, leadership, or teaching and I'll share specifics."
- When the user asks for career highlights, experience, resume, or leadership, expand to 5–7 detailed bullets plus a confident, energizing wrap-up sentence.${isPhilosophyQuestion ? '\n- For philosophy questions: Reference interview Q&A or leadership philosophy sections. Explain the core principles clearly and connect to practical examples from projects or roles.' : ''}${isAchievementQuestion ? '\n- For achievement questions: Reference major achievements sections. Include specific metrics, outcomes, and impact. Highlight what made each achievement significant.' : ''}${isAcronymQuestion ? '\n- For acronym questions (CNS, RAS, etc.): Explain what the acronym stands for, what it is, and its significance. Be clear and concise.' : ''}${isProjectQuestion ? '\n- For project questions: Provide context about what the project is, the problem it solved, key features, and measurable outcomes.' : ''}`.trim();

  if (history && history.length > 0) {
    prompt += `\n\nRECENT CONVERSATION:\n`;
    history.slice(-2).forEach((turn) => {
      prompt += `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}\n`;
    });
  }

  return prompt.trim();
}

export function extractCitations(
  answer: string,
  context: PromptContextEntry[]
): Array<{ title: string; sourceUrl: string }> {
  const citations: Array<{ title: string; sourceUrl: string }> = [];
  const citationRegex = /\[(\d+)\]/g;
  const matches = answer.matchAll(citationRegex);
  
  const seen = new Set<number>();
  for (const match of matches) {
    const idx = parseInt(match[1], 10) - 1; // Convert to 0-based
    if (idx >= 0 && idx < context.length && !seen.has(idx)) {
      citations.push({
        title: context[idx].title,
        sourceUrl: context[idx].sourceUrl,
      });
      seen.add(idx);
    }
  }
  
  return citations;
}
