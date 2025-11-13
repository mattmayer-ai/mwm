import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface FeedbackButtonsProps {
  question: string;
  answer: string;
  citations?: Array<{ title: string; sourceUrl: string }>;
  messageId: string;
}

export function FeedbackButtons({ question, answer, citations, messageId }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const handleFeedback = async (verdict: 'up' | 'down') => {
    setFeedback(verdict);
    
    if (verdict === 'down') {
      setShowNoteInput(true);
    } else {
      // Submit positive feedback immediately
      await submitFeedback(verdict, '');
    }
  };

  const submitFeedback = async (verdict: 'up' | 'down', feedbackNote: string) => {
    try {
      const sessionId = localStorage.getItem('mwm_session_id') || 'unknown';
      
      await addDoc(collection(db, 'feedback'), {
        timestamp: new Date().toISOString(),
        sessionId,
        messageId,
        question,
        answer,
        citations: citations || [],
        verdict,
        note: feedbackNote || null,
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleNoteSubmit = async () => {
    if (feedback === 'down') {
      await submitFeedback('down', note);
      setShowNoteInput(false);
    }
  };

  if (feedback) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          {feedback === 'up' ? (
            <>
              <ThumbsUp className="w-4 h-4 text-green-600" />
              <span>Thanks for the feedback!</span>
            </>
          ) : (
            <>
              <ThumbsDown className="w-4 h-4 text-red-600" />
              <span>Thanks, we'll improve this.</span>
            </>
          )}
        </span>
        {showNoteInput && (
          <div className="mt-2 space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What felt off? (max 120 chars)"
              maxLength={120}
              rows={2}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{note.length}/120</span>
              <button
                onClick={handleNoteSubmit}
                className="px-3 py-1 text-xs bg-brand-blue text-white rounded hover:bg-brand-pink"
              >
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={() => handleFeedback('up')}
        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
        aria-label="Helpful"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleFeedback('down')}
        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
        aria-label="Not helpful"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
}

