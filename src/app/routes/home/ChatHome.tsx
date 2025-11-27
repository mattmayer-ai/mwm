import { useRef, useEffect, useState, useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useChatStore } from '../../../features/chat/store';
import { injectOGTags } from '../../../lib/og';
import { FeedbackButtons } from '../../../features/chat/FeedbackButtons';
import { QuickActionsDock } from '../../../components/QuickActionsDock';
import { Bot } from 'lucide-react';
import { useThemeStore } from '../../../stores/theme.store';
import { useArtifactsStore } from '../../../stores/artifacts.store';
import { CanvasArtifact } from '../../../components/CanvasArtifact';
import { snapToGridWithTransform, screenToCanvas, snapToGrid } from '../../../lib/grid-snap';

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
const INITIAL_SCALE = 1.05; // 5% more zoomed in than before
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
  const getEffectiveTheme = useThemeStore((state) => state.getEffectiveTheme);
  const theme = useThemeStore((state) => state.theme);
  const [isDark, setIsDark] = useState(() => getEffectiveTheme() === 'dark');
  const artifacts = useArtifactsStore((state) => state.artifacts);
  const addArtifact = useArtifactsStore((state) => state.addArtifact);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasContentRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const interactionLayerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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
  const isOverUIRef = useRef(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia?.(DESKTOP_MEDIA_QUERY).matches ?? false;
  });
  const [inputValue, setInputValue] = useState('');

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

  // Global drop handler for artifacts - works even when dragging from modals
  useEffect(() => {
    if (!isDesktop) return;

    const handleDragOver = (e: DragEvent) => {
      // Only handle artifact drops (application/json data type)
      if (!e.dataTransfer?.types.includes('application/json')) {
        return;
      }

      // Check if dragging over UI elements
      const elementUnder = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      const isOverUI = elementUnder?.closest('.chat-card-container, .quick-actions-dock, button, input, textarea, a, .canvas-artifact, [role="dialog"]') !== null;
      
      if (!isOverUI) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
      } else {
        e.dataTransfer.dropEffect = 'none';
      }
    };

    const handleDrop = (e: DragEvent) => {
      // Only handle artifact drops
      if (!e.dataTransfer?.types.includes('application/json')) {
        return;
      }

      // Check if dropping on UI elements
      const elementUnder = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      const isOverUI = elementUnder?.closest('.chat-card-container, .quick-actions-dock, button, input, textarea, a, .canvas-artifact, [role="dialog"]') !== null;
      
      if (isOverUI) {
        return; // Don't drop on UI elements
      }

      e.preventDefault();
      e.stopPropagation();

      try {
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;

        const artifactData = JSON.parse(data);
        const { type, data: artifactItemData } = artifactData;

        // Calculate drop position relative to canvas
        const dropX = e.clientX;
        const dropY = e.clientY;

        // Convert to canvas coordinates first
        const canvasPos = screenToCanvas(dropX, dropY, transform);
        
        // Snap to grid in canvas space (40px grid)
        const snappedCanvas = snapToGrid(canvasPos.x, canvasPos.y);

        // Create artifact with snapped position
        addArtifact({
          type,
          data: artifactItemData,
          position: snappedCanvas,
          visible: true,
          zIndex: 10 + artifacts.length, // Increment z-index for layering
        });
      } catch (error) {
        console.error('Failed to create artifact from drop:', error);
      }
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [isDesktop, transform, artifacts.length, addArtifact]);

  // Update dark mode state when theme changes
  useEffect(() => {
    setIsDark(getEffectiveTheme() === 'dark');
  }, [theme, getEffectiveTheme]);

  const scheduleRender = useCallback(() => {
    if (rafRef.current || !canvasContentRef.current) {
      return;
    }
    rafRef.current = requestAnimationFrame(() => {
      const { scale, x, y } = transformRef.current;
      if (canvasContentRef.current) {
        if (isDesktop) {
          // Apply transform: translate first, then scale around center
          canvasContentRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
          canvasContentRef.current.style.transformOrigin = 'center center';
        } else {
          // On mobile, ensure no transform is applied
          canvasContentRef.current.style.transform = 'none';
        }
      }
      rafRef.current = undefined;
    });
  }, [isDesktop]);

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
        // Get pointer position relative to canvas wrapper
        const pointerX = focal.x - rect.left;
        const pointerY = focal.y - rect.top;
        
        // Get the center of the viewport (transform origin is 'center center')
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Convert pointer to world coordinates
        // The transform is: translate(x, y) then scale(s) around center
        // To reverse: (pointer - center - translate) / scale + center = world
        const worldX = (pointerX - centerX - current.x) / current.scale + centerX;
        const worldY = (pointerY - centerY - current.y) / current.scale + centerY;
        
        // After zoom, keep the same world point under the cursor
        // pointer = center + translate + (world - center) * newScale
        // translate = pointer - center - (world - center) * newScale
        nextX = pointerX - centerX - (worldX - centerX) * clampedScale;
        nextY = pointerY - centerY - (worldY - centerY) * clampedScale;
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

  // Reset canvas transform on mobile
  useEffect(() => {
    if (!isDesktop && canvasContentRef.current) {
      canvasContentRef.current.style.transform = 'none';
      // Reset transform state for mobile
      transformRef.current = { scale: INITIAL_SCALE, x: 0, y: 0 };
      setTransform({ scale: INITIAL_SCALE, x: 0, y: 0 });
    }
  }, [isDesktop]);

  useEffect(() => {
    persistZoom(transform.scale);
  }, [persistZoom, transform.scale]);

  useEffect(() => {
    if (!isDesktop) {
      return;
    }
    // Attach wheel handler to canvas wrapper so it's always active (not dependent on pointer-events)
    const node = canvasWrapperRef.current;
    if (!node) {
      return;
    }
    const handleWheel = (event: WheelEvent) => {
      // Don't zoom if user is interacting with input/textarea
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      
      // Check what element is under the cursor
      const elementUnder = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
      
      // If cursor is over chat modal container, allow native scroll (don't zoom)
      const chatCard = elementUnder?.closest('.chat-card-container');
      if (chatCard) {
        return; // Let chat modal handle scroll natively
      }
      
      // Check for other UI elements that should handle scroll
      const quickActions = elementUnder?.closest('.quick-actions-dock');
      const isOverInput = elementUnder?.tagName === 'INPUT' || elementUnder?.tagName === 'TEXTAREA' || elementUnder?.isContentEditable;
      const isOverButton = elementUnder?.tagName === 'BUTTON' || elementUnder?.closest('button') !== null;
      const isOverLink = elementUnder?.tagName === 'A' || elementUnder?.closest('a') !== null;
      
      // Block zoom if over interactive elements
      if (isOverInput || isOverButton || isOverLink || quickActions) {
        return; // Let UI handle scroll
      }
      
      // Cursor is over canvas - apply zoom
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
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [applyZoom, resetCanvas, translateBy, isDesktop]);

  const isPointerOverUIElement = useCallback((clientX: number, clientY: number): boolean => {
    // Check if pointer is over QuickActionsDock (bottom center, approximately 400px wide, 80px tall)
    // Dock is positioned at bottom-6 (24px) from bottom, centered horizontally
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const dockCenterX = viewportWidth / 2;
    const dockBottom = viewportHeight - 24; // bottom-6 = 1.5rem = 24px
    const dockTop = dockBottom - 80; // Approximate height of dock
    const dockWidth = 500; // Generous width to account for all buttons and spacing
    
    const isOverDock = 
      clientX >= dockCenterX - dockWidth / 2 &&
      clientX <= dockCenterX + dockWidth / 2 &&
      clientY >= dockTop &&
      clientY <= viewportHeight;
    
    // Check if pointer is over chat card
    const card = canvasContentRef.current?.querySelector('.chat-card-container');
    if (card) {
      const cardRect = card.getBoundingClientRect();
      const isOverCard =
        clientX >= cardRect.left &&
        clientX <= cardRect.right &&
        clientY >= cardRect.top &&
        clientY <= cardRect.bottom;
      
      if (isOverCard) {
        return true;
      }
    }
    
    return isOverDock;
  }, []);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDesktop) {
      return;
    }
    if (event.button !== 0 && event.pointerType !== 'touch') {
      return;
    }
    
    // Don't start panning if pointer is over UI elements
    if (isPointerOverUIElement(event.clientX, event.clientY)) {
      return;
    }
    
    event.preventDefault();
    panStateRef.current = { x: event.clientX, y: event.clientY };
    setIsPointerPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [isDesktop, isPointerOverUIElement]);

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

  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    const value = inputValue.trim();
    if (value && !isLoading) {
      sendMessage(value);
      setInputValue('');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const backgroundStyle = isDark
    ? {
        background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        backgroundPosition: '0 0, 0 0',
      }
    : {
        background: 'linear-gradient(135deg, #dfe7f5 0%, #b5c7df 100%)',
        backgroundImage: 'radial-gradient(circle, rgba(15,23,42,0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        backgroundPosition: '0 0, 0 0',
      };

  // Removed cardScale - no longer scaling chat card to avoid pixelation

  return (
    <main className="relative min-h-dvh overflow-hidden bg-gray-100 dark:bg-gray-900">
      <div ref={canvasWrapperRef} className="relative min-h-dvh w-full overflow-hidden">
        <a href="/" className="absolute right-6 top-6 z-[1] hidden transition-opacity hover:opacity-90 md:block opacity-95" style={{ zIndex: 1 }}>
          <img src="/favicon.png" alt="mwm" className="w-[100px] h-auto" />
        </a>
        {/* Background canvas layer - this gets scaled/transformed */}
        <div
          ref={canvasContentRef}
          className={`absolute inset-0 h-full w-full ${isDesktop ? 'will-change-transform' : ''}`}
          style={isDesktop ? { 
            transformOrigin: 'center center',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            imageRendering: 'auto',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            zIndex: 1,
          } : undefined}
        >
          {/* Background pattern - this is what gets zoomed/panned */}
          <div 
            className="absolute inset-0 h-full w-full"
            style={backgroundStyle}
            aria-hidden="true"
          />
        </div>

        {/* Artifacts layer - renders artifacts on canvas */}
        {isDesktop && (
          <>
            {/* Drop zone - separate layer for accepting drops */}
            <div
              className="absolute inset-0 z-[25]"
              style={{ pointerEvents: 'auto' }}
              onDragEnter={(e) => {
                if (!isDesktop) return;
                const elementUnder = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
                const isOverUI = elementUnder?.closest('.chat-card-container, .quick-actions-dock, button, input, textarea, a, .canvas-artifact') !== null;
                if (!isOverUI) {
                  e.preventDefault();
                }
              }}
              onDragOver={(e) => {
                if (!isDesktop) return;
                // Check if dragging over UI elements - if so, don't allow drop
                const elementUnder = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
                const isOverUI = elementUnder?.closest('.chat-card-container, .quick-actions-dock, button, input, textarea, a, .canvas-artifact') !== null;
                
                if (!isOverUI) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'move';
                } else {
                  e.dataTransfer.dropEffect = 'none';
                }
              }}
              onDrop={(e) => {
                if (!isDesktop) return;
                
                // Check if dropping on UI elements
                const elementUnder = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
                const isOverUI = elementUnder?.closest('.chat-card-container, .quick-actions-dock, button, input, textarea, a, .canvas-artifact') !== null;
                
                if (isOverUI) {
                  return; // Don't drop on UI elements
                }
                
                e.preventDefault();
                e.stopPropagation();

                try {
                  const data = e.dataTransfer.getData('application/json');
                  if (!data) return;

                  const artifactData = JSON.parse(data);
                  const { type, data: artifactItemData } = artifactData;

                  // Calculate drop position relative to canvas
                  const dropX = e.clientX;
                  const dropY = e.clientY;

                  // Convert to canvas coordinates first
                  const canvasPos = screenToCanvas(dropX, dropY, transform);
                  
                  // Snap to grid in canvas space (40px grid)
                  const snappedCanvas = snapToGrid(canvasPos.x, canvasPos.y);

                  // Create artifact with snapped position
                  addArtifact({
                    type,
                    data: artifactItemData,
                    position: snappedCanvas,
                    visible: true,
                    zIndex: 10 + artifacts.length, // Increment z-index for layering
                  });
                } catch (error) {
                  console.error('Failed to create artifact from drop:', error);
                }
              }}
            />
            {/* Artifacts rendering */}
            <div className="absolute inset-0 z-[20]" style={{ pointerEvents: 'none' }}>
              {artifacts.map((artifact) => (
                <CanvasArtifact
                  key={artifact.id}
                  artifact={artifact}
                  canvasTransform={transform}
                  isDesktop={isDesktop}
                />
              ))}
            </div>
          </>
        )}

        {/* Chat card - zooms with canvas using CSS zoom to prevent pixelation */}
        <div 
          className="absolute inset-0 flex min-h-dvh w-full items-end justify-center px-2 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-4 sm:pb-[calc(7rem+env(safe-area-inset-bottom))] md:items-center md:pt-0 md:pb-0 md:px-6 pointer-events-none z-30"
          style={isDesktop ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            zoom: transform.scale,
          } : undefined}
        >
          <div
            className="chat-card-container relative w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[50rem] pointer-events-auto md:-mt-[60px]"
            style={{
              imageRendering: 'auto',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility',
              zIndex: 30,
            }}
          >
              <div className="rounded-[10px] border border-gray-200/50 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800" style={{ position: 'relative', zIndex: 30 }}>
                <div className="border-b border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800 sm:px-4 sm:py-3 md:px-6 md:py-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Bot className="h-4 w-4 text-brand-pink sm:h-5 sm:w-5 md:h-6 md:w-6" aria-hidden="true" />
                    <h1 className="text-sm font-semibold tracking-wide text-gray-900 dark:text-gray-100 sm:text-base md:text-lg">
                      Ask me anything about my career journey
                    </h1>
                  </div>
                </div>

                <div 
                  ref={messagesContainerRef}
                  className="max-h-[calc(100vh-200px)] md:h-[450px] overflow-y-auto bg-white p-3 dark:bg-gray-800 sm:p-4 md:p-6"
                >
                  {messages.length === 0 ? (
                    <div className="flex h-full min-h-[250px] sm:min-h-[320px] md:min-h-[400px] flex-col items-center justify-center text-center px-2">
                      <div className="mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-brand-blue/10 dark:bg-brand-blue-dark/20">
                        <svg className="h-6 w-6 sm:h-8 sm:w-8 text-brand-blue dark:text-brand-blue/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                      <h2 className="mb-1.5 sm:mb-2 text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Start a conversation</h2>
                      <p className="max-w-md text-xs sm:text-sm md:text-[0.95rem] text-gray-600 dark:text-gray-400 px-2">
                        Try asking: "What's your experience with React?" or "Tell me about a project you worked on"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4 min-h-[250px] sm:min-h-[320px] md:min-h-[400px]">
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
                                className={`max-w-[85%] sm:max-w-[80%] rounded-[10px] px-3 py-2 sm:px-4 sm:py-3 ${
                                  message.role === 'user'
                                    ? 'bg-brand-blue text-white'
                                    : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-200'
                                }`}
                              >
                                {displayContent && (
                                  <p className="whitespace-pre-wrap text-sm sm:text-[0.95rem] leading-relaxed">{displayContent}</p>
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
                            <div className="rounded-lg bg-gray-100 px-4 py-3 dark:bg-gray-700">
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

                <div className="border-t border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-700 dark:bg-gray-800 sm:px-4 sm:py-3.5 md:px-6 md:py-4">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask about experience, case studies, or results…"
                      className="flex-1 rounded-[10px] border border-gray-300 bg-white px-3 py-2.5 text-base sm:text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 md:text-[0.95rem] cursor-text relative z-50 min-h-[44px] sm:min-h-0 sm:py-1.5"
                      style={{ pointerEvents: 'auto' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      onFocus={() => {
                        // Store scroll position before potential zoom
                        if (typeof window !== 'undefined') {
                          (window as any).__preFocusScrollY = window.scrollY;
                        }
                      }}
                      onBlur={() => {
                        // Reset viewport zoom after input blur
                        if (typeof window !== 'undefined') {
                          // Use visualViewport API if available (iOS Safari)
                          if (window.visualViewport) {
                            // Reset scroll position to prevent zoom artifacts
                            window.scrollTo(0, (window as any).__preFocusScrollY || 0);
                            // Small delay to ensure viewport resets
                            setTimeout(() => {
                              window.scrollTo(0, 0);
                            }, 100);
                          } else {
                            // Fallback: reset scroll position
                            window.scrollTo(0, (window as any).__preFocusScrollY || 0);
                          }
                        }
                      }}
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleSend}
                      className="shrink-0 rounded-[10px] bg-brand-blue h-[44px] w-[44px] sm:h-[36px] sm:w-[36px] text-white transition-colors hover:bg-brand-pink disabled:opacity-50 flex items-center justify-center"
                      disabled={isLoading || !inputValue.trim()}
                      aria-label="Send message"
                    >
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* Interaction layer - uses document.elementFromPoint to detect UI elements */}
        <div
          ref={interactionLayerRef}
          className={`absolute inset-0 z-[15] hidden md:block`}
          onDragOver={(e) => {
            // Don't interfere with artifact drops - let drop zone handle it
            if (e.dataTransfer.types.includes('application/json')) {
              return; // Let the drop zone at z-[25] handle it
            }
          }}
          onMouseMove={(event) => {
            if (!isDesktop) return;
            
            // Use elementFromPoint to check what's actually under the cursor
            const elementUnder = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
            const isOverUI = elementUnder?.closest('.chat-card-container, .quick-actions-dock, button, input, textarea, a') !== null ||
                            isPointerOverUIElement(event.clientX, event.clientY);
            
            // Update ref for use in other handlers
            isOverUIRef.current = isOverUI;
            
            // Update cursor but don't disable pointer events - let pointer events work naturally
            if (isOverUI) {
              event.currentTarget.style.cursor = 'auto';
            } else {
              event.currentTarget.style.cursor = isPointerPanning ? 'grabbing' : 'grab';
            }
          }}
          onPointerMove={(event) => {
            if (!isDesktop) return;
            // Only handle panning if active - cursor management is done in onMouseMove
            if (panStateRef.current) {
              handlePointerMove(event);
            }
          }}
          onPointerDown={(event) => {
            if (!isDesktop) return;
            
            // Don't interfere with artifact dragging
            const elementUnder = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
            if (elementUnder?.closest('.canvas-artifact') !== null) {
              return; // Let artifact handle its own pointer events
            }
            
            // Double-check using elementFromPoint and ref
            const isOverUI = isOverUIRef.current ||
                            elementUnder?.closest('.chat-card-container, .quick-actions-dock, button, input, textarea, a') !== null ||
                            isPointerOverUIElement(event.clientX, event.clientY);
            
            // Don't start panning if clicking on UI elements
            if (isOverUI) {
              return; // Let UI handle the event naturally
            }
            handlePointerDown(event);
          }}
          onPointerUp={endPointerPan}
          onPointerCancel={endPointerPan}
          onPointerLeave={(event) => {
            event.currentTarget.style.cursor = 'grab';
            endPointerPan(event);
          }}
          style={{
            touchAction: 'none',
            pointerEvents: 'auto',
            cursor: 'grab',
          }}
          aria-label="Interactive canvas area (click and drag to pan)"
        />
      </div>

      <QuickActionsDock />
    </main>
  );
}

