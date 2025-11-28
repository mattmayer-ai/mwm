import { useState } from 'react';
import { Menu, Sun, Moon, Monitor, Info } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useThemeStore } from '../stores/theme.store';
import { TrustDialogWrapper } from './TrustDialogWrapper';

export function ControlsMenu() {
  const { theme, setTheme } = useThemeStore();
  const [trustOpen, setTrustOpen] = useState(false);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="group flex flex-col items-center gap-1 px-2 py-1 text-gray-600 dark:text-gray-400 transition-colors"
            aria-label="Menu"
          >
            <div className="rounded-lg p-1.5 bg-gray-100/70 dark:bg-gray-800/70 group-hover:bg-brand-blue dark:group-hover:bg-brand-blue transition-colors">
              <Menu className="w-5 h-5 group-hover:text-white transition-colors" />
            </div>
            <span className="text-[10px] uppercase tracking-wide hidden sm:block">Menu</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="min-w-[220px] rounded-[10px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 shadow-xl z-50">
            {/* Theme Section */}
            <div className="px-2 py-1.5">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Theme</div>
              <div className="flex gap-1">
                <button
                  onClick={() => setTheme('system')}
                  className={`flex-1 rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/40 ${
                    theme === 'system'
                      ? 'bg-brand-blue text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Monitor className="w-3 h-3 inline mr-1" />
                  System
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/40 ${
                    theme === 'light'
                      ? 'bg-brand-blue text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Sun className="w-3 h-3 inline mr-1" />
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/40 ${
                    theme === 'dark'
                      ? 'bg-brand-blue text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Moon className="w-3 h-3 inline mr-1" />
                  Dark
                </button>
              </div>
            </div>

            <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

            {/* How the AI works */}
            <DropdownMenu.Item asChild className="outline-none border-0 focus:outline-none focus:ring-0">
              <button
                onClick={() => setTrustOpen(true)}
                className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/40 active:outline-none transition-colors"
              >
                <Info className="w-4 h-4" />
                How the AI works
              </button>
            </DropdownMenu.Item>

          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Trust Dialog - controlled externally */}
      {trustOpen && <TrustDialogWrapper onClose={() => setTrustOpen(false)} />}
    </>
  );
}

