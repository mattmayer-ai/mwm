import * as Dialog from '@radix-ui/react-dialog';

interface WideModalProps {
  trigger?: React.ReactNode;
  title: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: 'wide' | 'narrow' | 'square';
  nested?: boolean; // For nested modals (higher z-index)
}

export function WideModal({ trigger, title, children, open, onOpenChange, size = 'wide', nested = false }: WideModalProps) {
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const widthClass = 
    size === 'narrow' ? 'max-w-2xl' : 
    size === 'square' ? 'max-w-3xl' : 
    'max-w-5xl';
  const zIndexOverlay = nested ? 'z-[60]' : 'z-40';
  const zIndexContent = nested ? 'z-[70]' : 'z-50';
  
  return (
    <Dialog.Root open={isControlled ? open : undefined} onOpenChange={isControlled ? onOpenChange : undefined}>
      {!isControlled && trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className={`fixed inset-0 bg-black/30 backdrop-blur-sm ${zIndexOverlay}`} />
        <Dialog.Content className={`fixed left-1/2 top-1/2 ${zIndexContent} w-[94vw] ${widthClass} -translate-x-1/2 -translate-y-1/2 rounded-[10px] border border-gray-200/70 dark:border-gray-800/70 bg-white/95 dark:bg-gray-900/90 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto`}>
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <Dialog.Description className="sr-only">
            {title} modal content
          </Dialog.Description>
          <div className="text-gray-900 dark:text-gray-100">{children}</div>
          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <button className="rounded-[10px] px-4 py-2 text-sm font-medium bg-brand-blue text-white hover:bg-brand-pink transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/40">
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

