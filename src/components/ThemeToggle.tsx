import { useThemeStore } from '../stores/theme.store';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-1">
      <button
        onClick={() => setTheme('light')}
        className={`rounded px-2 py-1 text-sm transition-colors ${
          theme === 'light'
            ? 'bg-brand-blue/10 dark:bg-brand-blue-dark/20 text-blue-700 dark:text-blue-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        aria-label="Light mode"
        title="Light mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`rounded px-2 py-1 text-sm transition-colors ${
          theme === 'system'
            ? 'bg-brand-blue/10 dark:bg-brand-blue-dark/20 text-blue-700 dark:text-blue-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        aria-label="System theme"
        title="System theme"
      >
        <Monitor className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`rounded px-2 py-1 text-sm transition-colors ${
          theme === 'dark'
            ? 'bg-brand-blue/10 dark:bg-brand-blue-dark/20 text-blue-700 dark:text-blue-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        aria-label="Dark mode"
        title="Dark mode"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}

