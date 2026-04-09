import { createContext, useContext, useState, useEffect } from "react";
import type { User } from "./DataContext";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  apiLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const USER_KEY  = "auth_user";
const TOKEN_KEY = "auth_token";

async function writeLog(
  token: string,
  user: User,
  category: string,
  action: string,
  detail: string,
  severity: "info" | "warning" | "error" = "info"
) {
  try {
    await fetch(`${API}/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
  } catch { /* silently fail */ }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem(USER_KEY);
      return stored ? (JSON.parse(stored) as User) : null;
    } catch { return null; }
  });

  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(TOKEN_KEY)
  );

  useEffect(() => {
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    else      sessionStorage.removeItem(USER_KEY);
  }, [user]);

  useEffect(() => {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else       sessionStorage.removeItem(TOKEN_KEY);
  }, [token]);

  const apiLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Log failed login attempt — no token yet so call directly
        try {
          await fetch(`${API}/logs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: "auth",
              action: "Login Failed",
              detail: `Failed login attempt for ${email}`,
              severity: "warning",
              performedBy: "unknown",
              performedByName: email,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch { /* silently fail */ }
        return { success: false, error: data.error ?? "Login failed" };
      }
      setUser(data.user);
      setToken(data.token);
      await writeLog(data.token, data.user, "auth", "Login", `${data.user.name} logged in`, "info");
      return { success: true };
    } catch {
      return { success: false, error: "Cannot connect to server. Is it running?" };
    }
  };

  const login = (u: User, t: string): void => {
    setUser(u);
    setToken(t);
  };

  const logout = (): void => {
    if (user && token) {
      writeLog(token, user, "auth", "Logout", `${user.name} logged out`, "info");
    }
    setUser(null);
    setToken(null);
  };

  const updateCurrentUser = (updates: Partial<User>): void => {
    setUser(prev => (prev ? { ...prev, ...updates } : prev));
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user, apiLogin, login, logout, updateCurrentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
