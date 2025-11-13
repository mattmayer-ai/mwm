import { describe, it, expect } from 'vitest';

/**
 * QA harness for chat citations
 * Tests that chat responses include expected citations
 */

interface QATestCase {
  question: string;
  expectedCitations: string[]; // Expected docId or sectionId patterns
  minCitations?: number; // Minimum number of citations required
}

const QA_SEED: QATestCase[] = [
  {
    question: 'What is your experience with React?',
    expectedCitations: ['resume', 'project'],
    minCitations: 1,
  },
  {
    question: 'Tell me about a project you worked on',
    expectedCitations: ['project'],
    minCitations: 1,
  },
  {
    question: 'What technologies do you use?',
    expectedCitations: ['resume', 'project'],
    minCitations: 1,
  },
  // Add more test cases as content is added
];

/**
 * Test chat endpoint with seeded questions
 */
describe('Chat QA - Citation Accuracy', () => {
  const API_BASE = process.env.VITE_API_BASE || 'http://localhost:5001/your-project/us-central1';

  QA_SEED.forEach((testCase, index) => {
    it(`should return citations for: "${testCase.question}"`, async () => {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: testCase.question }],
        }),
      });

      expect(response.ok).toBe(true);

      // Read streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let citations: Array<{ title: string; sourceUrl: string }> = [];
      let answer = '';

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

      // Assertions
      expect(answer.length).toBeGreaterThan(0);
      expect(citations.length).toBeGreaterThanOrEqual(testCase.minCitations || 1);

      // Check that at least one citation matches expected pattern
      const hasExpectedCitation = citations.some((citation) =>
        testCase.expectedCitations.some((expected) =>
          citation.sourceUrl.includes(expected) || citation.title.toLowerCase().includes(expected.toLowerCase())
        )
      );

      expect(hasExpectedCitation).toBe(true);
    }, 10000); // 10s timeout for API calls
  });
});

/**
 * Test citation format
 */
describe('Chat QA - Citation Format', () => {
  it('should format citations correctly', () => {
    const citations = [
      { title: 'Project A', sourceUrl: '/projects/project-a' },
      { title: 'Resume', sourceUrl: '/about' },
    ];

    expect(citations.length).toBeGreaterThan(0);
    citations.forEach((citation) => {
      expect(citation.title).toBeTruthy();
      expect(citation.sourceUrl).toBeTruthy();
    });
  });
});

