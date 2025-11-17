#!/usr/bin/env tsx
/**
 * Test suite for chat function
 * Run with: tsx tests/chat-test-suite.ts
 */

const CHAT_URL = process.env.CHAT_URL || 'http://localhost:5001/askmwm/us-east1/chat';

interface TestCase {
  question: string;
  category: string;
  expectedKeywords?: string[];
  shouldNotContain?: string[];
}

const TEST_QUESTIONS: TestCase[] = [
  // Philosophy questions
  {
    question: "whats your philosophy",
    category: "Philosophy",
    expectedKeywords: ["philosophy", "leadership", "approach"],
    shouldNotContain: ["I don't have that", "I stay focused"],
  },
  {
    question: "what's your product philosophy",
    category: "Philosophy",
    expectedKeywords: ["philosophy", "product"],
    shouldNotContain: ["I don't have that"],
  },
  {
    question: "what's your leadership philosophy",
    category: "Philosophy",
    expectedKeywords: ["leadership", "philosophy"],
    shouldNotContain: ["I don't have that"],
  },
  
  // Achievement questions
  {
    question: "tell me about matss best acheivement",
    category: "Achievements",
    expectedKeywords: ["achievement", "win", "success", "result"],
    shouldNotContain: ["I don't have that", "I stay focused"],
  },
  {
    question: "what are your biggest wins",
    category: "Achievements",
    expectedKeywords: ["win", "achievement", "success"],
    shouldNotContain: ["I don't have that"],
  },
  {
    question: "what's your greatest accomplishment",
    category: "Achievements",
    expectedKeywords: ["accomplishment", "achievement"],
    shouldNotContain: ["I don't have that"],
  },
  
  // CNS questions
  {
    question: "what is CNS",
    category: "CNS",
    expectedKeywords: ["CNS", "Central Nervous System", "innovation"],
    shouldNotContain: ["I don't have that", "I stay focused"],
  },
  {
    question: "tell me about CNS",
    category: "CNS",
    expectedKeywords: ["CNS", "platform", "innovation"],
    shouldNotContain: ["I don't have that"],
  },
  {
    question: "what does CNS stand for",
    category: "CNS",
    expectedKeywords: ["Central Nervous System"],
    shouldNotContain: ["I don't have that"],
  },
  
  // Project questions
  {
    question: "what's your most recent project",
    category: "Projects",
    expectedKeywords: ["project", "CNS", "Swift Racks"],
    shouldNotContain: ["I don't have that"],
  },
  {
    question: "tell me about TakeCost",
    category: "Projects",
    expectedKeywords: ["TakeCost", "construction", "pivot"],
    shouldNotContain: ["I don't have that"],
  },
  
  // Leadership questions
  {
    question: "how do you lead teams",
    category: "Leadership",
    expectedKeywords: ["lead", "team", "leadership"],
    shouldNotContain: ["I don't have that"],
  },
  {
    question: "what's your leadership style",
    category: "Leadership",
    expectedKeywords: ["leadership", "style", "approach"],
    shouldNotContain: ["I don't have that"],
  },
  
  // Experience questions
  {
    question: "what did you do at Air Canada",
    category: "Experience",
    expectedKeywords: ["Air Canada", "training", "iPad"],
    shouldNotContain: ["I don't have that"],
  },
  {
    question: "tell me about RaceRocks",
    category: "Experience",
    expectedKeywords: ["RaceRocks", "defense", "simulator"],
    shouldNotContain: ["I don't have that"],
  },
];

async function testChat(question: string): Promise<{ answer: string; citations: any[]; error?: string }> {
  try {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: question }],
      }),
    });

    if (!response.ok) {
      return {
        answer: '',
        citations: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return {
        answer: '',
        citations: [],
        error: 'No response body',
      };
    }

    const decoder = new TextDecoder();
    let answer = '';
    let citations: any[] = [];
    let buffer = '';

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
            if (data.type === 'chunk') {
              answer += data.content || '';
            } else if (data.type === 'done') {
              citations = data.citations || [];
            } else if (data.type === 'error') {
              return {
                answer: '',
                citations: [],
                error: data.message || 'Unknown error',
              };
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    return { answer, citations };
  } catch (error: any) {
    return {
      answer: '',
      citations: [],
      error: error.message || String(error),
    };
  }
}

async function runTests() {
  console.log(`\n🧪 Testing chat function at: ${CHAT_URL}\n`);
  console.log(`Running ${TEST_QUESTIONS.length} test questions...\n`);

  const results: Array<{
    question: string;
    category: string;
    passed: boolean;
    answer: string;
    error?: string;
    hasKeywords?: boolean;
    hasRefusal?: boolean;
  }> = [];

  for (const test of TEST_QUESTIONS) {
    process.stdout.write(`Testing: "${test.question}"... `);
    
    const result = await testChat(test.question);
    
    if (result.error) {
      console.log(`❌ ERROR: ${result.error}`);
      results.push({
        question: test.question,
        category: test.category,
        passed: false,
        answer: '',
        error: result.error,
      });
      continue;
    }

    const answer = result.answer.trim();
    const lowerAnswer = answer.toLowerCase();
    
    // Check for refusal messages
    const hasRefusal = test.shouldNotContain?.some(phrase => 
      lowerAnswer.includes(phrase.toLowerCase())
    ) || false;
    
    // Check for expected keywords
    const hasKeywords = test.expectedKeywords?.some(keyword =>
      lowerAnswer.includes(keyword.toLowerCase())
    ) || false;
    
    const passed = !hasRefusal && hasKeywords && answer.length > 20;
    
    if (passed) {
      console.log(`✅ PASS`);
    } else {
      console.log(`❌ FAIL`);
      if (hasRefusal) console.log(`   → Contains refusal message`);
      if (!hasKeywords) console.log(`   → Missing expected keywords: ${test.expectedKeywords?.join(', ')}`);
      if (answer.length <= 20) console.log(`   → Answer too short: ${answer.length} chars`);
    }
    
    results.push({
      question: test.question,
      category: test.category,
      passed,
      answer: answer.slice(0, 200) + (answer.length > 200 ? '...' : ''),
      hasKeywords,
      hasRefusal,
    });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log(`\n\n📊 Test Results Summary\n`);
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.passed).length}`);
  console.log(`Failed: ${results.filter(r => !r.passed).length}\n`);

  // Group by category
  const byCategory = results.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, typeof results>);

  for (const [category, categoryResults] of Object.entries(byCategory)) {
    const passed = categoryResults.filter(r => r.passed).length;
    const total = categoryResults.length;
    console.log(`${category}: ${passed}/${total} passed`);
  }

  // Show failures
  const failures = results.filter(r => !r.passed);
  if (failures.length > 0) {
    console.log(`\n❌ Failed Tests:\n`);
    for (const failure of failures) {
      console.log(`Question: "${failure.question}"`);
      if (failure.error) console.log(`Error: ${failure.error}`);
      if (failure.hasRefusal) console.log(`Issue: Contains refusal message`);
      if (!failure.hasKeywords) console.log(`Issue: Missing expected keywords`);
      console.log(`Answer: ${failure.answer || '(empty)'}\n`);
    }
  }

  process.exit(failures.length > 0 ? 1 : 0);
}

runTests().catch(console.error);

