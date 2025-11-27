import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface TrustDialogWrapperProps {
  onClose: () => void;
}

export function TrustDialogWrapper({ onClose }: TrustDialogWrapperProps) {
  const [lastIndexedAt, setLastIndexedAt] = useState<string | null>(null);

  useEffect(() => {
    loadLastIndexed();
  }, []);

  const loadLastIndexed = async () => {
    try {
      const metaDoc = await getDoc(doc(db, 'meta', 'index'));
      if (metaDoc.exists()) {
        const data = metaDoc.data();
        if (data?.lastIndexedAt) {
          // Handle Firestore Timestamp or ISO string
          let date: Date;
          if (data.lastIndexedAt.toDate && typeof data.lastIndexedAt.toDate === 'function') {
            // Firestore Timestamp
            date = data.lastIndexedAt.toDate();
          } else if (typeof data.lastIndexedAt === 'string') {
            // ISO string
            date = new Date(data.lastIndexedAt);
          } else {
            // Fallback: try to construct Date
            date = new Date(data.lastIndexedAt);
          }
          
          if (!isNaN(date.getTime())) {
            setLastIndexedAt(date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load lastIndexedAt:', err);
    }
  };

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[560px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-[10px] bg-white dark:bg-gray-900 p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            How the AI works
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Information about how the AI assistant works, including model details, data sources, and privacy information.
          </Dialog.Description>
          <div className="mt-4 text-sm text-gray-700 dark:text-gray-300 space-y-3">
            <p>
              Answers are grounded in Matt's projects, case studies, resume, and teaching notes using retrieval-augmented generation (RAG). The model never pulls from public web data.
            </p>
            <p>
              The knowledge base draws from over 20 years of Matt's career experience, encompassing more than 10,000 lines of documentation, project details, frameworks, and insights from roles at Air Canada, RaceRocks, and Swift Racks.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Model:</strong> Anthropic Claude 3.5 Sonnet (AWS Bedrock)</li>
              <li><strong>Index last updated:</strong> {lastIndexedAt || '—'}</li>
              <li><strong>Privacy:</strong> no PII stored; anonymized analytics only</li>
              <li><strong>Sources:</strong> projects, case studies, resume & teaching content</li>
            </ul>
            <p className="pt-2">
              If something looks off, down-vote the answer and I'll review it.
            </p>
          </div>
          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <button
                onClick={onClose}
                className="rounded-[10px] bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-pink focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              >
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

