"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, Customer, CustomerSummary } from "./api";

const TOKEN_KEY = "osta_token";

type AuthState = {
  token: string | null;
  customer: Customer | CustomerSummary | null;
  loading: boolean;
  login: (token: string, customer: CustomerSummary) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | CustomerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.resolve().then(async () => {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;
      if (!stored) {
        setLoading(false);
        return;
      }
      setToken(stored);
      try {
        const me = await api.me(stored);
        setCustomer(me);
      } catch {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const login = useCallback((newToken: string, newCustomer: CustomerSummary) => {
    window.localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setCustomer(newCustomer);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
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
