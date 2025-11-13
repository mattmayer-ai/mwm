import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { X, MessageSquare } from 'lucide-react';
import { useChatStore } from './store';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  scope?: string; // Optional docId for scoped retrieval (e.g., "project-slug")
  defaultOpen?: boolean; // Whether to open by default
}

export function ChatPanel({ scope, defaultOpen = false }: ChatPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { messages, isLoading, error, sendMessage, clearMessages } = useChatStore();

  const handleSend = async (content: string) => {
    // Normalize scope: if it's "project-slug", convert to "project-slug" for docId matching
    const normalizedScope = scope?.startsWith('project-') ? scope : scope ? `project-${scope}` : undefined;
    await sendMessage(content, normalizedScope);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="fixed bottom-6 right-6 bg-brand-blue hover:bg-brand-pink text-white rounded-full p-4 shadow-lg transition-colors"
          aria-label="Open chat"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed bottom-0 right-0 w-full md:w-96 h-[600px] bg-white dark:bg-gray-900 rounded-t-lg md:rounded-lg shadow-xl z-50 flex flex-col">
          <Dialog.Title className="sr-only">Chat</Dialog.Title>
          <Dialog.Description className="sr-only">
            Chat interface for asking questions about work, experience, and projects.
          </Dialog.Description>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">Ask about my work</h2>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Clear
                </button>
              )}
              <Dialog.Close asChild>
                <button
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>
          </div>
          <Tabs.Root defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
            <Tabs.List className="flex border-b border-gray-200 dark:border-gray-700">
              <Tabs.Trigger
                value="chat"
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:text-brand-blue data-[state=active]:border-b-2 data-[state=active]:border-brand-blue"
              >
                Chat
              </Tabs.Trigger>
              <Tabs.Trigger
                value="history"
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:text-brand-blue data-[state=active]:border-b-2 data-[state=active]:border-brand-blue"
              >
                History
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="chat" className="flex-1 flex flex-col overflow-hidden">
              <ChatMessageList messages={messages} isLoading={isLoading} error={error} />
              <ChatInput onSend={handleSend} disabled={isLoading} />
            </Tabs.Content>
            <Tabs.Content value="history" className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chat history will be saved here (coming soon)
              </p>
            </Tabs.Content>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

