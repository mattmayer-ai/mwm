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
          const date = new Date(data.lastIndexedAt);
          setLastIndexedAt(date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }));
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[560px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            How the AI works
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Information about how the AI assistant works, including model details, data sources, and privacy information.
          </Dialog.Description>
          <div className="mt-4 text-sm text-gray-700 dark:text-gray-300 space-y-3">
            <p>
              Answers come strictly from this site's projects, case studies, and resume via 
              retrieval-augmented generation (RAG). Each claim links to a source.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Model:</strong> Anthropic Claude 3.5 Sonnet</li>
              <li><strong>Index last updated:</strong> {lastIndexedAt || '—'}</li>
              <li><strong>Privacy:</strong> no PII stored; anonymized analytics only</li>
              <li><strong>Sources:</strong> projects, case studies, resume content</li>
            </ul>
            <p className="pt-2">
              If something looks off, down-vote the answer and I'll review it.
            </p>
          </div>
          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <button
                onClick={onClose}
                className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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

