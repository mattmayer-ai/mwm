import { useEffect, useRef } from 'react';
import type { ChatMessage } from './types';
import { CitationLink } from './CitationLink';
import { FeedbackButtons } from './FeedbackButtons';
import { ToneBadge } from './ToneBadge';

// Extract sectionId from sourceUrl (format: /projects/slug#sec-sectionId)
function extractSectionId(sourceUrl: string): string | undefined {
  const hash = new URL(sourceUrl, window.location.origin).hash;
  return hash.replace('#sec-', '') || undefined;
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

export function ChatMessageList({ messages, isLoading, error }: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <p className="text-sm">Ask me anything about my work, experience, or projects.</p>
        </div>
      )}
      {messages.map((message, index) => {
        const hasContent = Boolean(message.content && message.content.trim().length > 0);
        const displayContent =
          hasContent || message.role !== 'assistant'
            ? message.content
            : '…';

        return (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-brand-blue text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
            >
            {/* Show tone badge immediately when tone is known, even during streaming */}
            {message.role === 'assistant' && message.tone && (
              <div className="mb-2">
                <ToneBadge tone={message.tone} />
              </div>
            )}
            {message.tone === 'personal' && (
              <div className="mb-2 text-xs italic text-gray-600 dark:text-gray-400">
                *Content note: this touches on intense emotions.*
              </div>
            )}
            {displayContent && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{displayContent}</p>
              </div>
            )}
            {message.citations && message.citations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                <p className="text-xs font-semibold mb-2">Sources:</p>
                <ul className="space-y-1">
                  {message.citations.map((citation, idx) => (
                    <li key={idx}>
                      <CitationLink
                        citation={citation}
                        index={idx + 1}
                        sectionId={extractSectionId(citation.sourceUrl)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {message.role === 'assistant' && hasContent && (
              <FeedbackButtons
                question={messages[index - 1]?.content || ''}
                answer={message.content}
                citations={message.citations}
                messageId={message.id}
              />
            )}
          </div>
        </div>
        );
      })}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="flex justify-start">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

