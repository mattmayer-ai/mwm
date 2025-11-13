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
    const error = await res.text();
    throw new Error(`Chat API error: ${res.status} ${error}`);
  }

  const ctype = res.headers.get('content-type') || '';
  
  if (ctype.includes('event-stream')) {
    // Parse SSE stream
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');
    
    const decoder = new TextDecoder();
    let buffer = '';
    let answer = '';
    let citations: Array<{ title: string; sourceUrl: string }> = [];

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
            } else if (data.type === 'done' && data.citations) {
              citations = data.citations;
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    return { answer_md: answer, citations };
  } else {
    // JSON response
    return await res.json();
  }
}

describe('chat smoke', () => {
  it('answers with citations', async () => {
    const out = await ask('Give me a short overview of your AI work.');
    expect(out.answer_md || out.answer).toBeTruthy();
    expect(Array.isArray(out.citations)).toBe(true);
    expect(out.citations.length).toBeGreaterThanOrEqual(1);
  }, 30000); // 30s timeout

  it('handles questions gracefully when no context', async () => {
    const out = await ask('What is the meaning of life?');
    expect(out.answer_md || out.answer).toBeTruthy();
    // Should either have citations or acknowledge lack of context
  }, 30000);
});

