import { create } from 'zustand';

type Theme = 'system' | 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  getEffectiveTheme: () => 'light' | 'dark';
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: (typeof window !== 'undefined' ? (localStorage.getItem('theme') as Theme) : null) || 'system',
  setTheme: (theme: Theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    set({ theme });
    // Apply theme immediately
    if (typeof window !== 'undefined') {
      applyTheme(theme);
    }
  },
  getEffectiveTheme: () => {
    const { theme } = get();
    if (typeof window === 'undefined') return 'light';
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  },
}));

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && systemDark);
  root.classList.toggle('dark', isDark);
}

// Apply theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('theme') as Theme;
  const theme = stored || 'system';
  applyTheme(theme);

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme === 'system') {
      applyTheme('system');
    }
  });
}

