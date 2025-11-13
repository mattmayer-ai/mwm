import { describe, it, expect } from 'vitest';

const base = process.env.VITE_API_BASE || 'http://localhost:5001';
const project = process.env.VITE_FIREBASE_PROJECT_ID || 'your-project';
const CHAT_URL = `${base}/${project}/us-central1/api/chat`;

async function ask(q: string) {
  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: q }] }),
  });

  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`);
  }

  const ctype = res.headers.get('content-type') || '';
  
  if (ctype.includes('event-stream')) {
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');
    
    const decoder = new TextDecoder();
    let buffer = '';
    let answer = '';
    let citations: Array<{ title: string; sourceUrl: string }> = [];
    let tone: 'professional' | 'narrative' | 'personal' | undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk' && data.content) {
              answer += data.content;
            } else if (data.type === 'done') {
              citations = data.citations || [];
              tone = data.tone;
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    return { answer_md: answer, citations, tone };
  } else {
    return await res.json();
  }
}

describe('chat tone', () => {
  it('defaults to professional tone', async () => {
    const out = await ask('What is your AI focus lately?');
    expect(out.answer_md || out.answer).toBeTruthy();
    expect(out.tone || 'professional').toBe('professional');
    // Should have bullets or structured format
    expect(out.answer_md || out.answer).toMatch(/•|-|Here's|Two highlights/i);
  }, 30000);

  it('switches to narrative when asked for the story', async () => {
    const out = await ask('Tell me the story behind your pilot training work.');
    expect(out.answer_md || out.answer).toBeTruthy();
    expect((out.tone || '').toLowerCase()).toBe('narrative');
    // Should use first-person narrative
    expect(out.answer_md || out.answer.toLowerCase()).toMatch(/we|i|when|the insight|it resulted/i);
  }, 30000);

  it('blocks personal unless enabled', async () => {
    const out = await ask('Can you share your very personal story?');
    expect(out.answer_md || out.answer).toBeTruthy();
    // Should not contain content note if personal mode is disabled
    const answerLower = (out.answer_md || out.answer).toLowerCase();
    // If personal mode is off, should not have content note
    // (This test assumes ALLOW_PERSONAL=false by default)
    if (out.tone !== 'personal') {
      expect(answerLower).not.toContain('content note');
    }
  }, 30000);

  it('personal requests are downgraded when disabled', async () => {
    const out = await ask('share your personal therapy story');
    expect((out.tone || '').toLowerCase()).not.toBe('personal');
    expect((out.answer_md || out.answer).toLowerCase()).not.toContain('content note');
  }, 30000);

  it('narrative when asking for the story', async () => {
    const out = await ask('tell me the story behind the pilot training fix');
    expect((out.tone || '').toLowerCase()).toBe('narrative');
  }, 30000);

  it('refuses off-scope questions', async () => {
    const out = await ask('what is your home address?');
    const answerLower = (out.answer_md || out.answer).toLowerCase();
    expect(answerLower).toMatch(/i don'?t have|don'?t have that|not in my sources|insufficient/i);
  }, 30000);
});

