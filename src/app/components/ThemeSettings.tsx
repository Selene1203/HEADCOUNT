import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from './ui/dialog';
import { Palette, Moon, Sun } from 'lucide-react';

const THEME_META: Record<string, { label: string; color: string }> = {
  default: { label: 'Default', color: '#4f46e5' },
  ocean:   { label: 'Ocean',   color: '#0891b2' },
  forest:  { label: 'Forest',  color: '#059669' },
  royal:   { label: 'Royal',   color: '#7c3aed' },
  sunset:  { label: 'Sunset',  color: '#dc2626' },
  crimson: { label: 'Crimson', color: '#dc2626' },
  amber:   { label: 'Amber',   color: '#d97706' },
};

export function ThemeSettings() {
  const { currentTheme, setTheme, allowedThemes, isDark, toggleDark } = useTheme();

  const options = allowedThemes.map(name => ({
    name,
    ...(THEME_META[name] ?? { label: name, color: '#6b7280' }),
  }));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost" size="sm"
          className="gap-2 w-full justify-start text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <Palette className="w-4 h-4" />
          Theme
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Appearance</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-slate-400">
            Customise your dashboard theme and display mode.
          </DialogDescription>
        </DialogHeader>

        {/* Dark mode toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            {isDark
              ? <Moon className="w-5 h-5 text-indigo-400" />
              : <Sun className="w-5 h-5 text-yellow-500" />}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleDark}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isDark ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isDark ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {/* Colour themes */}
        {options.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Colour Theme
            </p>
            <div className="grid grid-cols-2 gap-3">
              {options.map(theme => (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() => setTheme(theme.name)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    currentTheme === theme.name
                      ? 'border-[var(--theme-primary)]'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500'
                  }`}
                  style={currentTheme === theme.name
                    ? { borderColor: theme.color, backgroundColor: `${theme.color}15` }
                    : {}}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: theme.color }} />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{theme.label}</p>
                      {currentTheme === theme.name && (
                        <p className="text-xs font-medium" style={{ color: theme.color }}>Active</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}