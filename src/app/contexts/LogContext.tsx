import { createContext, useContext, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

const API = import.meta.env.VITE_API_URL ?? '${import.meta.env.VITE_API_URL}';

export type LogCategory =
  | 'auth'
  | 'user_management'
  | 'attendance'
  | 'student_status'
  | 'data_export';

export interface ActivityLog {
  id: string;
  category: LogCategory;
  action: string;
  detail: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
}

interface LogContextValue {
  log: (
    category: LogCategory,
    action: string,
    detail: string,
    severity?: 'info' | 'warning' | 'error'
  ) => Promise<void>;
}

const LogContext = createContext<LogContextValue | null>(null);

export const LogProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();

  const log = useCallback(async (
    category: LogCategory,
    action: string,
    detail: string,
    severity: 'info' | 'warning' | 'error' = 'info'
  ) => {
    if (!user || !token) return;
    try {
      await fetch(`${API}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          action,
          detail,
          severity,
          performedBy: user.id,
          performedByName: user.name,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // Silently fail — logs must never break the UI
    }
  }, [user, token]);

  return (
    <LogContext.Provider value={{ log }}>
      {children}
    </LogContext.Provider>
  );
};

export const useLog = (): LogContextValue => {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error('useLog must be used within LogProvider');
  return ctx;
};
