import { createContext, useContext, useState, useEffect } from "react";
import type { User } from "./DataContext";

const API = import.meta.env.VITE_API_URL ?? "${import.meta.env.VITE_API_URL}";

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

  // Keep sessionStorage in sync
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
      if (!res.ok) return { success: false, error: data.error ?? "Login failed" };
      setUser(data.user);
      setToken(data.token);
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