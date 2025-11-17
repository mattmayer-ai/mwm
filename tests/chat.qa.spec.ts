import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { TRAP_QUESTIONS } from './fixtures/trapQuestions';

const qaFile = path.resolve(process.cwd(), 'content/interviews/matt_interview_qna.mdx');
const fileContents = readFileSync(qaFile, 'utf8');

type QAEntry = { question: string; answer: string };

function parseQA(content: string): QAEntry[] {
  const blocks = content.split(/^##\s+/m).slice(1);
  return blocks.map((block) => {
    const [heading, ...bodyParts] = block.split('\n');
    const question = heading.trim();
    const answer = bodyParts.join('\n').trim();
    return { question, answer };
  });
}

const ENTRIES = parseQA(fileContents);

describe('Interview Q&A corpus integrity', () => {
  it('contains 50 Q&A entries', () => {
    expect(ENTRIES.length).toBe(50);
  });

  it('answers use first-person voice', () => {
    const firstPerson = /(\bI\b|I['’](?:m|ve)|\bmy\b|\bme\b)/i;
    const offenders = ENTRIES.filter((entry) => !firstPerson.test(entry.answer));
    expect(offenders).toHaveLength(0);
  });

  it('answers stay within 200 words unless explicitly longer', () => {
    const tooLong = ENTRIES.filter((entry) => entry.answer.split(/\s+/).length > 220);
    expect(tooLong).toHaveLength(0);
  });
});

describe('Trap question coverage', () => {
  it('includes at least 10 out-of-scope traps', () => {
    expect(TRAP_QUESTIONS.length).toBeGreaterThanOrEqual(10);
  });

  it('traps reference non-Matt employers to ensure refusal flow', () => {
    TRAP_QUESTIONS.forEach((trap) => {
      expect(/google|meta|microsoft|amazon|apple|openai|nyt|new york times|twitter|salesforce|aws/.test(trap.toLowerCase())).toBe(true);
    });
  });
});

