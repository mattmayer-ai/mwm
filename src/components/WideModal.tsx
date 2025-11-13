import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface WideModalProps {
  trigger?: React.ReactNode;
  title: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WideModal({ trigger, title, children, open, onOpenChange }: WideModalProps) {
  const isControlled = open !== undefined && onOpenChange !== undefined;
  
  return (
    <Dialog.Root open={isControlled ? open : undefined} onOpenChange={isControlled ? onOpenChange : undefined}>
      {!isControlled && trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/95 dark:bg-gray-900/90 backdrop-blur-md p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-lg p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            {title} modal content
          </Dialog.Description>
          <div className="text-gray-900 dark:text-gray-100">{children}</div>
          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <button className="rounded-xl px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

