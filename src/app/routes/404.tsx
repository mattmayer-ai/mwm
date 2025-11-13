import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Page not found
      </p>
      <p className="text-gray-500 dark:text-gray-500 mb-12">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-6 py-3 text-white hover:bg-brand-pink transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          Ask the assistant
        </Link>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          View portfolio
        </Link>
      </div>
    </main>
  );
}

