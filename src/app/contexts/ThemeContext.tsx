import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

interface ThemeContextType {
  currentTheme: string;
  themes: Record<string, ThemeColors>;
  setTheme: (themeName: string) => void;
  allowedThemes: string[];
  addCustomTheme: (name: string, colors: ThemeColors) => void;
  isDark: boolean;
  toggleDark: () => void;
}

export const defaultThemes: Record<string, ThemeColors> = {
  default: {
    primary:    '#4f46e5',
    secondary:  '#818cf8',
    accent:     '#06b6d4',
    background: '#ffffff',
    text:       '#1f2937',
  },
  ocean: {
    primary:    '#0891b2',
    secondary:  '#06b6d4',
    accent:     '#14b8a6',
    background: '#ffffff',
    text:       '#1f2937',
  },
  forest: {
    primary:    '#059669',
    secondary:  '#10b981',
    accent:     '#84cc16',
    background: '#ffffff',
    text:       '#1f2937',
  },
  royal: {
    primary:    '#7c3aed',
    secondary:  '#a78bfa',
    accent:     '#ec4899',
    background: '#ffffff',
    text:       '#1f2937',
  },
  sunset: {
    primary:    '#dc2626',
    secondary:  '#f97316',
    accent:     '#fbbf24',
    background: '#ffffff',
    text:       '#1f2937',
  },
  crimson: {
    primary:    '#dc2626',
    secondary:  '#ef4444',
    accent:     '#f97316',
    background: '#ffffff',
    text:       '#1f2937',
  },
  amber: {
    primary:    '#d97706',
    secondary:  '#f59e0b',
    accent:     '#ef4444',
    background: '#ffffff',
    text:       '#1f2937',
  },
};

const ROLE_THEMES: Record<string, string[]> = {
  admin:    ['crimson', 'amber'],
  lecturer: ['forest', 'ocean'],
  student:  ['default', 'royal'],
};

const ROLE_DEFAULT_THEME: Record<string, string> = {
  admin:    'crimson',
  lecturer: 'forest',
  student:  'default',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [currentTheme, setCurrentTheme] = useState('default');
  const [themes, setThemes]             = useState(defaultThemes);

  // ── Dark mode: honour saved preference, fall back to system ──
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('nul-dark');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const role          = user?.role ?? 'student';
  const allowedThemes = ROLE_THEMES[role] ?? ROLE_THEMES.student;

  // When role changes, enforce the correct default theme
  useEffect(() => {
    if (!user) return;
    const savedKey = `nul-theme-${user.role}`;
    const saved    = localStorage.getItem(savedKey);
    const allowed  = ROLE_THEMES[user.role] ?? [];
    const resolved = saved && allowed.includes(saved)
      ? saved
      : ROLE_DEFAULT_THEME[user.role] ?? 'default';
    setCurrentTheme(resolved);
  }, [user?.role]);

  // Apply dark class to <html>
  useEffect(() => {
    const root = document.documentElement;
    isDark ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('nul-dark', String(isDark));
  }, [isDark]);

  // Watch for OS-level theme changes and auto-switch
  // if the user hasn't manually overridden the setting
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('nul-dark') === null) {
        setIsDark(e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply CSS variables
  useEffect(() => {
    const colors = themes[currentTheme];
    if (!colors) return;
    const root = document.documentElement;
    root.style.setProperty('--theme-primary',    colors.primary);
    root.style.setProperty('--theme-secondary',  colors.secondary);
    root.style.setProperty('--theme-accent',     colors.accent);
    root.style.setProperty('--theme-background', colors.background);
    root.style.setProperty('--theme-text',       colors.text);
  }, [currentTheme, themes]);

  // Persist manual toggle and stop auto-switching once overridden
  const toggleDark = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('nul-dark', String(next));
      return next;
    });
  };

  const setTheme = (name: string) => {
    if (!allowedThemes.includes(name)) return;
    setCurrentTheme(name);
    if (user?.role) localStorage.setItem(`nul-theme-${user.role}`, name);
  };

  const addCustomTheme = (name: string, colors: ThemeColors) => {
    setThemes(prev => ({ ...prev, [name]: colors }));
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme, themes, setTheme, allowedThemes,
      addCustomTheme, isDark, toggleDark,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}