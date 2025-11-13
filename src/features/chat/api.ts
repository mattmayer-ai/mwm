// ChatMessage type imported only where needed

// Use relative path for same-origin (Firebase Hosting rewrites) or full URL for Functions
const API_BASE = import.meta.env.VITE_API_BASE || '';

interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  scope?: string;
}

interface ChatChunk {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  citations?: Array<{ title: string; sourceUrl: string }>;
  tone?: 'professional' | 'narrative' | 'personal';
  message?: string;
}

/**
 * Stream chat response from API
 */
export async function streamChat(
  request: ChatRequest,
  onChunk: (chunk: string) => void,
  onComplete: (citations: Array<{ title: string; sourceUrl: string }>, tone?: 'professional' | 'narrative' | 'personal') => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMessage = 'Chat request failed';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Chat API error:', {
          status: response.status,
          statusText: response.statusText,
          error,
        });
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        console.error('Chat API error (failed to parse):', {
          status: response.status,
          statusText: response.statusText,
        });
      }
      onError(errorMessage);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('No response body');
      return;
    }

    const decoder = new TextDecoder();
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
            const data: ChatChunk = JSON.parse(line.slice(6));
            if (data.type === 'chunk' && data.content) {
              onChunk(data.content);
            } else if (data.type === 'done' && data.citations) {
              onComplete(data.citations, data.tone);
            } else if (data.type === 'error') {
              onError(data.message || 'Unknown error');
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Network error');
  }
}

