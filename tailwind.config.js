/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2e4059',
          pink: '#f15e60',
          'blue-light': '#3d5a7a',
          'blue-dark': '#1e2a3a',
          'pink-light': '#ff7a7c',
          'pink-dark': '#d14a4c',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        DEFAULT: 'var(--radius)',
      },
    },
  },
  plugins: [
    function({ addComponents }: { addComponents: (components: Record<string, Record<string, string>>) => void }) {
      addComponents({
        '.card-rect': {
          '@apply rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg': {},
        },
        '.modal-wide': {
          '@apply max-w-4xl lg:max-w-5xl p-6 sm:p-8': {},
        },
        '.actions-bar': {
          '@apply fixed inset-x-0 bottom-6 z-30 flex justify-center gap-3 pb-safe': {},
        },
      });
    },
  ],
  darkMode: 'class',
}

