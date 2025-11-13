#!/usr/bin/env tsx
/**
 * Quick test script to verify chat API is working
 */

const API_URL = process.env.VITE_API_BASE || 'http://localhost:5001/your-project/us-central1/api/chat';

async function testChat() {
  console.log('Testing chat API...');
  console.log(`API URL: ${API_URL}`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'What is your experience with React?',
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Chat API error:', response.status, error);
      return;
    }

    console.log('✅ Chat API is responding!');
    console.log('Streaming response...\n');

    const reader = response.body?.getReader();
    if (!reader) {
      console.error('❌ No response body');
      return;
    }

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
              process.stdout.write(data.content);
              answer += data.content;
            } else if (data.type === 'done' && data.citations) {
              citations = data.citations;
            } else if (data.type === 'error') {
              console.error('\n❌ Error:', data.message);
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    console.log('\n\n📚 Citations:');
    citations.forEach((citation, idx) => {
      console.log(`  [${idx + 1}] ${citation.title} - ${citation.sourceUrl}`);
    });

    console.log('\n✅ Chat test complete!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n💡 Make sure:');
    console.log('  1. Firebase Functions are running (emulator or deployed)');
    console.log('  2. ANTHROPIC_API_KEY is set in Functions environment');
    console.log('  3. Content has been ingested (npm run ingest)');
  }
}

testChat();

