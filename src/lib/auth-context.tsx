"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, Customer, CustomerSummary } from "./api";

const TOKEN_KEY = "osta_token";

type AuthState = {
  token: string | null;
  customer: Customer | CustomerSummary | null;
  loading: boolean;
  // remember (default true): keep the login after the browser is closed; false keeps it for this tab only.
  login: (token: string, customer: CustomerSummary, remember?: boolean) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

// The login lives in localStorage ("Remember me") or, when that is not chosen, in sessionStorage (until the tab is closed).
function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function clearStoredToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | CustomerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.resolve().then(async () => {
      const stored = typeof window !== "undefined" ? readStoredToken() : null;
      if (!stored) {
        setLoading(false);
        return;
      }
      setToken(stored);
      try {
        const me = await api.me(stored);
        setCustomer(me);
      } catch {
        clearStoredToken();
        setToken(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const login = useCallback((newToken: string, newCustomer: CustomerSummary, remember = true) => {
    clearStoredToken();
    try {
      (remember ? window.localStorage : window.sessionStorage).setItem(TOKEN_KEY, newToken);
    } catch {
      // Storage blocked: the visitor stays logged in until the page is closed.
    }
    setToken(newToken);
    setCustomer(newCustomer);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setCustomer(null);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) return;
    const me = await api.me(token);
    setCustomer(me);
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, customer, loading, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
