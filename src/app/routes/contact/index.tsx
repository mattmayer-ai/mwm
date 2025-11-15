import { useState } from 'react';

export default function Contact() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
      hp: formData.get('hp') || '', // Hidden honeypot field - backend expects 'hp'
    };

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || '';
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP_${res.status}`);
      }

      setStatus('ok');
      e.currentTarget.reset();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error. Please check your connection and try again.';
      setErrorMessage(errorMessage);
      setStatus('err');
    }
  }

  return (
    <main className="max-w-2xl mx-auto">
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Let's discuss how we can work together.
      </p>

      <form className="mt-4 space-y-4" onSubmit={submit}>
        {/* Honeypot field - hidden from users */}
        <input
          name="hp"
          type="text"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Your name"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="your@email.com"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            placeholder="How can we work together?"
            rows={4}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full rounded-lg bg-brand-blue px-4 py-2 text-white hover:bg-brand-pink disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'sending' ? 'Sending…' : 'Send Message'}
        </button>

        {status === 'ok' && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-green-800 dark:text-green-200">
            Thanks! I'll get back to you soon.
          </div>
        )}

        {status === 'err' && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-red-800 dark:text-red-200">
            {errorMessage || 'Something went wrong. Please try again.'}
          </div>
        )}
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Prefer to schedule a call?
        </p>
        <a
          href="https://cal.com/your-handle"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue dark:text-brand-blue/80 hover:underline"
        >
          Book time on Cal.com →
        </a>
      </div>
    </main>
  );
}

