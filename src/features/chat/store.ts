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
    
    // Validate input content
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return; // Don't send empty messages
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: trimmedContent,
      timestamp: new Date(),
    };

    // Create assistant message placeholder
    const assistantId = generateMessageId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    // Add both messages atomically in a single set() call
    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessage],
      isLoading: true,
      error: null,
    }));

    // Get updated state AFTER adding messages to build request
    const updatedState = get();
    
    // Build request - only include messages with real content (exclude empty assistant placeholder)
    const request = {
      messages: updatedState.messages
        .filter((m) => typeof m.content === 'string' && m.content.trim().length > 0)
        .map((m) => ({
          role: m.role,
          content: m.content,
        })),
      scope,
    };

    // Validate request before sending - ABORT if empty
    if (!request.messages || request.messages.length === 0) {
      console.error('ABORT: empty messages payload', request);
      set({
        error: 'Failed to prepare message. Please try again.',
        isLoading: false,
        messages: updatedState.messages.filter((msg) => msg.id !== assistantId),
      });
      return;
    }

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
          const currentState = get();
          // Update assistant message with error instead of removing it
          set({
            error,
            isLoading: false,
            messages: currentState.messages.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: 'Sorry — something broke. Try again in a moment.' }
                : msg
            ),
          });
        }
      );
    } catch (error) {
      const currentState = get();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Update assistant message with error instead of removing it
      set({
        error: errorMessage,
        isLoading: false,
        messages: currentState.messages.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: 'Sorry — something broke. Try again in a moment.' }
            : msg
        ),
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

