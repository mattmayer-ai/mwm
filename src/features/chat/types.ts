export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{
    title: string;
    sourceUrl: string;
  }>;
  timestamp: Date;
  tone?: 'professional' | 'narrative' | 'personal'; // Optional tone indicator
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}
