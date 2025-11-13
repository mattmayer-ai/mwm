/**
 * Prompt templates for Claude with dynamic tone selection
 */

export type TonePreset = 'professional' | 'narrative' | 'personal';

export const SYSTEM_PROMPT_BASE = `
You are "mwm" — the site owner's portfolio concierge.

GOAL
- Help visitors understand the owner's experience, decisions, and impact quickly, with sources.

SCOPE
- Answer ONLY from provided context/chunks (projects, case studies, resume).
- If context is insufficient, say: "I don't have that in my sources. I can share what's here or you can contact me."
- Never invent employers, titles, dates, or metrics.

FORMAT
- Prefer 3–6 concise bullets + a 1–2 sentence wrap-up.
- Keep answers ~160 words unless asked for depth.
- Always include 2–4 inline citations as [1], [2]… tied to exact sections, and list them after the answer.

REFUSALS & SAFETY
- Decline PII/personal details not present in sources.
- No medical/therapeutic advice. For mental-health themes, use supportive language and steer back to portfolio if not explicitly requested.
- Ask at most one brief clarifying question if necessary.

TONE = {{TONE_BLOCK}}
`;

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
 * Build system prompt with selected tone
 */
export function buildSystemPrompt(tone: TonePreset): string {
  return SYSTEM_PROMPT_BASE.replace('{{TONE_BLOCK}}', TONE_BLOCKS[tone]);
}

export function buildUserPrompt(
  question: string,
  context: Array<{ text: string; title: string; sourceUrl: string }>,
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
): string {
  let prompt = `Question: ${question}\n\n`;
  
  if (context.length > 0) {
    prompt += `Context:\n`;
    context.forEach((chunk, idx) => {
      prompt += `[${idx + 1}] ${chunk.title} (${chunk.sourceUrl})\n${chunk.text}\n\n`;
    });
  } else {
    prompt += `No relevant context found.\n\n`;
  }
  
  if (history && history.length > 0) {
    prompt += `Recent conversation:\n`;
    history.slice(-2).forEach((turn) => {
      prompt += `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `Answer the question using only the context provided. Include citations [1], [2], etc.`;
  
  return prompt;
}

export function extractCitations(
  answer: string,
  context: Array<{ title: string; sourceUrl: string }>
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
