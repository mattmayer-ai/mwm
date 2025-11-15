import { useRef, useEffect, useState, useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useChatStore } from '../../../features/chat/store';
import { injectOGTags } from '../../../lib/og';
import { FeedbackButtons } from '../../../features/chat/FeedbackButtons';
import { QuickActionsDock } from '../../../components/QuickActionsDock';
import { Bot } from 'lucide-react';

/**
 * Home page with centered chat interface
 * Similar to Magic Patterns style
 */
type CanvasTransform = {
  scale: number;
  x: number;
  y: number;
};

const MIN_SCALE = 0.75;
const MAX_SCALE = 1.5;
const INITIAL_SCALE = 1;
const CHAT_SCALE = 0.95;
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';
const MATT_BOT_GREETINGS = [
  "Hi—I'm Matt. Ask me anything about my product leadership journey or the AI platforms I'm scaling right now.",
  "Welcome back. I'm ready to dive into my CNS work, AutoTake CV pipeline, or any career detail you need.",
  "You're chatting directly with me; fire away with questions about my metrics, operating cadence, or decision frameworks.",
  "Happy to share the unvarnished versions of my project stories. What would you like to explore first?",
  "Glad you're here. I can walk through AI roadmaps, defense training builds, or leadership lessons—just ask.",
];

export function ChatHome() {
  const { messages, sendMessage, isLoading, addMessage } = useChatStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasContentRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const interactionLayerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const panStateRef = useRef<{ x: number; y: number } | null>(null);
  const [transform, setTransform] = useState<CanvasTransform>(() => {
    if (typeof window === 'undefined') {
      return { scale: INITIAL_SCALE, x: 0, y: 0 };
    }
    const stored = window.localStorage.getItem('canvasZoom');
    const parsed = stored ? Number.parseFloat(stored) : INITIAL_SCALE;
    return {
      scale: Number.isNaN(parsed) ? INITIAL_SCALE : parsed,
      x: 0,
      y: 0,
    };
  });
  const transformRef = useRef<CanvasTransform>(transform);
  const [isPointerPanning, setIsPointerPanning] = useState(false);
  const spaceHeldRef = useRef(false);
  const [spaceActive, setSpaceActive] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia?.(DESKTOP_MEDIA_QUERY).matches ?? false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    const mq = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };
    setIsDesktop(mq.matches);
    mq.addEventListener('change', handleChange);
    return () => {
      mq.removeEventListener('change', handleChange);
    };
  }, []);

  const scheduleRender = useCallback(() => {
    if (rafRef.current || !canvasContentRef.current) {
      return;
    }
    rafRef.current = requestAnimationFrame(() => {
      const { scale, x, y } = transformRef.current;
      if (canvasContentRef.current) {
        canvasContentRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      }
      rafRef.current = undefined;
    });
  }, []);

  const syncTransform = useCallback(
    (next: CanvasTransform) => {
      transformRef.current = next;
      setTransform(next);
      scheduleRender();
    },
    [scheduleRender],
  );

  const applyZoom = useCallback(
    (nextScale: number, focal?: { x: number; y: number }) => {
      const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
      const current = transformRef.current;
      if (Math.abs(clampedScale - current.scale) < 0.001 && !focal) {
        return;
      }

      let nextX = current.x;
      let nextY = current.y;

      if (focal && canvasWrapperRef.current) {
        const rect = canvasWrapperRef.current.getBoundingClientRect();
        const pointerX = focal.x - rect.left;
        const pointerY = focal.y - rect.top;
        const originX = (pointerX - current.x) / current.scale;
        const originY = (pointerY - current.y) / current.scale;
        nextX = pointerX - originX * clampedScale;
        nextY = pointerY - originY * clampedScale;
      }

      syncTransform({
        scale: clampedScale,
        x: nextX,
        y: nextY,
      });
    },
    [syncTransform],
  );

  const persistZoom = useCallback((value: number) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('canvasZoom', value.toString());
  }, []);

  const translateBy = useCallback(
    (deltaX: number, deltaY: number) => {
      const current = transformRef.current;
      syncTransform({
        scale: current.scale,
        x: current.x + deltaX,
        y: current.y + deltaY,
      });
    },
    [syncTransform],
  );

  const resetCanvas = useCallback(() => {
    syncTransform({ scale: INITIAL_SCALE, x: 0, y: 0 });
  }, [syncTransform]);

  useEffect(() => {
    scheduleRender();
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [scheduleRender]);

  useEffect(() => {
    persistZoom(transform.scale);
  }, [persistZoom, transform.scale]);

  useEffect(() => {
    if (!isDesktop) {
      return;
    }
    const node = interactionLayerRef.current;
    if (!node) {
      return;
    }
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const scaleFactor = Math.exp(-event.deltaY * 0.0015);
      applyZoom(transformRef.current.scale * scaleFactor, {
        x: event.clientX,
        y: event.clientY,
      });
    };
    node.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      node.removeEventListener('wheel', handleWheel);
    };
  }, [applyZoom, isDesktop]);

  useEffect(() => {
    if (!isDesktop) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const isEditable =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        applyZoom(transformRef.current.scale * 1.1);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '-') {
        event.preventDefault();
        applyZoom(transformRef.current.scale * 0.9);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '0') {
        event.preventDefault();
        resetCanvas();
        return;
      }

      if (event.code === 'Space' && !isEditable) {
        if (!spaceHeldRef.current) {
          spaceHeldRef.current = true;
          setSpaceActive(true);
        }
        event.preventDefault();
        return;
      }

      if (isEditable) {
        return;
      }

      const step = 24;
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        translateBy(0, step);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        translateBy(0, -step);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        translateBy(step, 0);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        translateBy(-step, 0);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        spaceHeldRef.current = false;
        setSpaceActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [applyZoom, resetCanvas, translateBy, isDesktop]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDesktop) {
      return;
    }
    if (event.button !== 0 && event.pointerType !== 'touch') {
      return;
    }
    event.preventDefault();
    panStateRef.current = { x: event.clientX, y: event.clientY };
    setIsPointerPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [isDesktop]);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDesktop) {
        return;
      }
      if (!panStateRef.current) {
        return;
      }
      event.preventDefault();
      const deltaX = event.clientX - panStateRef.current.x;
      const deltaY = event.clientY - panStateRef.current.y;
      translateBy(deltaX, deltaY);
      panStateRef.current = { x: event.clientX, y: event.clientY };
    },
    [translateBy, isDesktop],
  );

  const endPointerPan = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDesktop) {
      return;
    }
    if (panStateRef.current) {
      event.preventDefault();
      panStateRef.current = null;
      setIsPointerPanning(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, [isDesktop]);

  useEffect(() => {
    // Set OG tags for home page
    injectOGTags({
      title: 'mwm - AI-Driven Portfolio',
      description: 'Ask me anything about my experience, projects, and skills. Powered by RAG and Claude.',
      type: 'website',
      siteName: 'mwm',
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      const index = Math.floor(Math.random() * MATT_BOT_GREETINGS.length);
      const greeting =
        MATT_BOT_GREETINGS[index] ||
        "Hi, I'm Matt-Bot. Ask me anything about Matt's product leadership journey and results.";
      addMessage({ role: 'assistant', content: greeting });
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [messages.length, addMessage]);

  const handleSend = () => {
    const value = inputRef.current?.value.trim();
    if (value && !isLoading) {
      sendMessage(value);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const backgroundStyle = {
    background: 'linear-gradient(135deg, #dfe7f5 0%, #b5c7df 100%)',
    backgroundImage: 'radial-gradient(circle, rgba(15,23,42,0.08) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    backgroundPosition: '0 0, 0 0',
  } as const;

  const cardScale = isDesktop ? CHAT_SCALE : 1;

  return (
    <main className="relative min-h-dvh overflow-hidden" style={backgroundStyle}>
      <a href="/" className="absolute right-6 top-6 z-30 hidden opacity-90 transition-opacity hover:opacity-100 md:block">
        <img src="/favicon.png" alt="mwm" className="w-[100px] h-auto" />
      </a>

      <div ref={canvasWrapperRef} className="relative min-h-dvh w-full overflow-hidden">
        <div
          ref={canvasContentRef}
          className="absolute inset-0 h-full w-full will-change-transform"
          style={{ transformOrigin: 'center center' }}
        >
          <div className="flex min-h-dvh w-full items-end justify-center px-2 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-6 sm:px-4 sm:pb-[calc(6rem+env(safe-area-inset-bottom))] md:items-center md:p-6">
            <div
              className="chat-card-container relative z-20 w-full max-w-[53rem]"
              style={{
                transformOrigin: 'bottom right',
                transform: `scale(${cardScale})`,
              }}
            >
              <div className="rounded-xl border border-gray-200/50 bg-white shadow-2xl dark:border-gray-800/50 dark:bg-gray-900 md:rounded-2xl">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50 md:px-6 md:py-4">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-[#ff5a8f] md:h-6 md:w-6" aria-hidden="true" />
                    <h1 className="text-base font-semibold tracking-wide text-gray-900 dark:text-gray-100 md:text-lg">
                      Ask me anything about my career journey
                    </h1>
                  </div>
                </div>

                <div className="min-h-[320px] max-h-[60vh] overflow-y-auto bg-white p-4 dark:bg-gray-900 md:min-h-[450px] md:max-h-[60vh] md:p-6">
                  {messages.length === 0 ? (
                    <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue/10 dark:bg-brand-blue-dark/20">
                        <svg className="h-8 w-8 text-brand-blue dark:text-brand-blue/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                      <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Start a conversation</h2>
                      <p className="max-w-md text-[0.95rem] text-gray-600 dark:text-gray-400">
                        Try asking: "What's your experience with React?" or "Tell me about a project you worked on"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 min-h-[400px]">
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const hasContent = Boolean(message.content && message.content.trim().length > 0);
                          const displayContent =
                            hasContent || message.role !== 'assistant' ? message.content : '…';
                          return (
                            <div
                              key={message.id}
                              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                                  message.role === 'user'
                                    ? 'bg-brand-blue text-white'
                                    : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                                }`}
                              >
                                {displayContent && (
                                  <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">{displayContent}</p>
                                )}
                                {message.role === 'assistant' && hasContent && (
                                  <div className="mt-3">
                                    <FeedbackButtons
                                      question={messages[messages.indexOf(message) - 1]?.content || ''}
                                      answer={message.content}
                                      citations={message.citations}
                                      messageId={message.id.toString()}
                                    />
                                  </div>
                                )}
                                <div className="mt-2 text-xs text-gray-500 opacity-70 dark:text-gray-400">
                                  {new Date(message.timestamp).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false,
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="rounded-lg bg-gray-100 px-4 py-3 dark:bg-gray-800">
                              <div className="flex space-x-1">
                                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50 md:px-6 md:py-4">
                  <div className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900 md:px-4 md:py-3">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Ask about experience, case studies, or results…"
                      className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500 md:text-[0.95rem]"
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
                      className="shrink-0 rounded-lg bg-brand-blue p-2 text-white transition-colors hover:bg-brand-pink disabled:opacity-50"
                      disabled={isLoading}
                      aria-label="Send message"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          ref={interactionLayerRef}
          className={`absolute inset-0 z-10 hidden md:block ${isPointerPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          onPointerDown={(event) => {
            const card = canvasContentRef.current?.querySelector('.chat-card-container');
            if (card && card.contains(event.target as Node)) {
              return;
            }
            handlePointerDown(event);
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={endPointerPan}
          onPointerCancel={endPointerPan}
          onPointerLeave={endPointerPan}
          style={{
            touchAction: 'none',
            pointerEvents: spaceActive || isPointerPanning ? 'auto' : 'none',
          }}
          aria-label="Interactive canvas area"
        />
      </div>

      <QuickActionsDock />
    </main>
  );
}

