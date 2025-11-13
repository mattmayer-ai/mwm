import { useRef, useEffect } from 'react';
import { useChatStore } from '../../../features/chat/store';
import { injectOGTags } from '../../../lib/og';
import { FeedbackButtons } from '../../../features/chat/FeedbackButtons';
import { QuickActionsDock } from '../../../components/QuickActionsDock';

/**
 * Home page with centered chat interface
 * Similar to Magic Patterns style
 */
export function ChatHome() {
  const { messages, sendMessage, isLoading } = useChatStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Set OG tags for home page
    injectOGTags({
      title: 'mwm - AI-Driven Portfolio',
      description: 'Ask me anything about my experience, projects, and skills. Powered by RAG and Claude.',
      type: 'website',
      siteName: 'mwm',
    });
  }, []);

  const handleSend = () => {
    const value = inputRef.current?.value.trim();
    if (value && !isLoading) {
      sendMessage(value);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <main className="relative min-h-dvh overflow-hidden" style={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.015) 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
      backgroundPosition: '0 0, 0 0',
    }}>
      {/* Logo top-right - moved down and left slightly */}
      <a href="/" className="absolute right-6 top-6 z-20 opacity-90 hover:opacity-100 transition-opacity">
        <img src="/favicon.png" alt="mwm" className="w-[100px] h-auto" />
      </a>

      {/* Center stack - modal-style chat container */}
      <section className="container mx-auto px-4 flex items-center justify-center min-h-dvh py-20">
        <div className="w-full max-w-4xl">
          {/* Modal-style chat container */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
            {/* Chat header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Ask me anything about my work
                  </h1>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Today</span>
              </div>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Quick answers with citations. Sources come from my projects, case studies, and experience.
              </p>
            </div>

            {/* Chat messages area */}
            <div className="p-6 max-h-[60vh] min-h-[450px] overflow-y-auto bg-white dark:bg-gray-900">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="w-16 h-16 bg-brand-blue/10 dark:bg-brand-blue-dark/20 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-brand-blue dark:text-brand-blue/80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Start a conversation
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                  Try asking: "What's your experience with React?" or "Tell me about a project you worked on"
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Messages */}
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-brand-blue text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                        {message.citations && message.citations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-300/30 dark:border-gray-600/30">
                            <p className="text-xs font-semibold mb-2 text-gray-600 dark:text-gray-400">Sources:</p>
                            <ul className="space-y-1">
                              {message.citations.map((citation, idx) => (
                                <li key={idx}>
                                  <a
                                    href={citation.sourceUrl}
                                    className="text-xs text-brand-blue dark:text-brand-blue/80 hover:underline"
                                  >
                                    [{idx + 1}] {citation.title}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {message.role === 'assistant' && (
                          <div className="mt-3">
                            <FeedbackButtons
                              question={messages[messages.indexOf(message) - 1]?.content || ''}
                              answer={message.content}
                              citations={message.citations}
                              messageId={message.id.toString()}
                            />
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false 
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>

            {/* Chat input - inside modal */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about experience, case studies, or results…"
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  className="shrink-0 rounded-lg bg-brand-blue hover:bg-brand-pink text-white p-2 disabled:opacity-50 transition-colors"
                  disabled={isLoading}
                  aria-label="Send message"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom quick actions dock */}
      <QuickActionsDock />
    </main>
  );
}

