'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { api, getToken, setToken } from './api';
import type { AuthResponse, User } from './types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
  // True for a brief window right after logout() runs. A page's own
  // "redirect to /login if unauthenticated" guard effect fires reactively
  // whenever `user` goes null — including the instant logout() clears it,
  // racing the caller's own `router.push('/')` and sometimes winning,
  // which strands the user on /login?next=<protected page> instead of home.
  // Guards should skip their redirect while this is true.
  justLoggedOut: () => boolean;
}

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  company?: string;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<User>('/auth/me');
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    setToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api.post<AuthResponse>('/auth/register', input);
    setToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const justLoggedOutRef = useRef(false);
  const logout = useCallback(() => {
    justLoggedOutRef.current = true;
    setToken(null);
    setUser(null);
    // Long enough for the caller's own navigation (e.g. router.push('/')) to
    // take effect and unmount whatever protected page triggered this, short
    // enough that a real session expiry later on still redirects to login.
    setTimeout(() => {
      justLoggedOutRef.current = false;
    }, 1000);
  }, []);
  const justLoggedOut = useCallback(() => justLoggedOutRef.current, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refresh, justLoggedOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
