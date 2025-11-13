import { create } from 'zustand';
import type { ChatMessage } from './types';
import { streamChat } from './api';
import { trackChatStart, trackChatMessage } from '../../lib/analytics';

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string;
  
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  sendMessage: (content: string, scope?: string) => Promise<void>;
  clearMessages: () => void;
  setError: (error: string | null) => void;
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  sessionId: generateSessionId(),

  addMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: new Date(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  sendMessage: async (content: string, scope?: string) => {
    const state = get();
    
    // Track analytics
    if (state.messages.length === 0) {
      trackChatStart(); // First message in session
    }
    trackChatMessage();
    
    // Add user message
    state.addMessage({
      role: 'user',
      content,
    });

    // Set loading state
    set({ isLoading: true, error: null });

    // Create assistant message placeholder
    const assistantId = generateMessageId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    set((state) => ({
      messages: [...state.messages, assistantMessage],
    }));

    // Build request - only include messages with content (exclude empty assistant placeholder)
    const request = {
      messages: state.messages
        .filter((m) => m.content && m.content.trim().length > 0)
        .map((m) => ({
          role: m.role,
          content: m.content,
        })),
      scope,
    };

    let accumulatedContent = '';

    try {
      await streamChat(
        request,
        // onChunk
        (chunk) => {
          accumulatedContent += chunk;
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: accumulatedContent }
                : msg
            ),
          }));
        },
        // onComplete
        (citations, tone) => {
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: accumulatedContent, citations, tone }
                : msg
            ),
            isLoading: false,
          }));
        },
        // onError
        (error) => {
          set({
            error,
            isLoading: false,
            messages: state.messages.filter((msg) => msg.id !== assistantId),
          });
        }
      );
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
        messages: state.messages.filter((msg) => msg.id !== assistantId),
      });
    }
  },

  clearMessages: () => {
    set({
      messages: [],
      sessionId: generateSessionId(),
      error: null,
    });
  },

  setError: (error) => {
    set({ error });
  },
}));

