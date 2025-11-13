import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MetricsDisplay } from './MetricsDisplay';
import { TopMissesTable } from './TopMissesTable';

interface IndexMeta {
  lastIndexedAt?: string;
  chunkCount?: number;
  sourceCount?: number;
  version?: number;
}

interface AdminPanelProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AdminPanel({ open: externalOpen, onOpenChange }: AdminPanelProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [isReindexing, setIsReindexing] = useState(false);
  const [meta, setMeta] = useState<IndexMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [allowPersonal, setAllowPersonal] = useState(false);

  useEffect(() => {
    if (open) {
      loadMeta();
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'meta', 'settings'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setAllowPersonal(data.allowPersonal || false);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleTogglePersonal = async () => {
    const newValue = !allowPersonal;
    setAllowPersonal(newValue);
    try {
      // Get Firebase ID token for authentication
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const idToken = await user.getIdToken();
      
      // Call a Cloud Function to update settings (admin-only operation)
      const API_BASE = import.meta.env.VITE_API_BASE || '';
      const response = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ allowPersonal: newValue }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      setAllowPersonal(!newValue); // Revert on error
      alert(err instanceof Error ? err.message : 'Failed to update settings');
    }
  };

  const loadMeta = async () => {
    try {
      const metaDoc = await getDoc(doc(db, 'meta', 'index'));
      if (metaDoc.exists()) {
        setMeta(metaDoc.data() as IndexMeta);
      }
    } catch (err) {
      console.error('Failed to load index metadata:', err);
    }
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    setError(null);
    setSuccess(false);

    try {
      const adminSecret = prompt('Enter admin secret:');
      if (!adminSecret) {
        setIsReindexing(false);
        return;
      }

      const response = await fetch('/api/reindex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Reindexing failed');
      }

      const data = await response.json();
      setSuccess(true);
      setMeta({
        lastIndexedAt: data.lastIndexedAt,
        chunkCount: data.chunkCount,
        sourceCount: data.sourceCount,
      });

      // Reload meta after a short delay
      setTimeout(() => {
        loadMeta();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reindexing failed');
    } finally {
      setIsReindexing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // If controlled externally and closed, don't render
  if (externalOpen !== undefined && !externalOpen) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl z-50 p-6">
              <Dialog.Title className="text-xl font-semibold mb-4">Admin Panel</Dialog.Title>
              <Dialog.Description className="sr-only">
                Admin panel for managing content indexing, settings, and viewing analytics.
              </Dialog.Description>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Index Status
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Last Indexed:</span>
                  <span className="font-mono">{formatDate(meta?.lastIndexedAt)}</span>
                </div>
                {meta?.chunkCount !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Chunks:</span>
                    <span className="font-mono">{meta.chunkCount.toLocaleString()}</span>
                  </div>
                )}
                {meta?.sourceCount !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Sources:</span>
                    <span className="font-mono">{meta.sourceCount}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleReindex}
                disabled={isReindexing}
                className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-pink disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors"
              >
                {isReindexing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Reindexing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Reindex Content
                  </>
                )}
              </button>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Personal Mode
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Allow deeply personal responses
                  </p>
                </div>
                <button
                  onClick={handleTogglePersonal}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    allowPersonal ? 'bg-brand-blue' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      allowPersonal ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {success && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                Reindexing completed successfully
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <XCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-6">
              <MetricsDisplay />
              <TopMissesTable />
            </div>
          </div>

          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              ×
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

