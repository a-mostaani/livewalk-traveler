import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, liveWalkApi, type LiveWalkApiSurface } from './api';
import { browserTokenStore, type TokenStore } from './tokenStorage';
import type { Traveler } from './types';

type AuthState = 'restoring' | 'anonymous' | 'authenticated';

type AuthContextValue = {
  state: AuthState;
  token: string;
  user?: Traveler;
  busy: boolean;
  error: string;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  expire: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  apiClient = liveWalkApi,
  tokenStore = browserTokenStore,
}: {
  children: ReactNode;
  apiClient?: LiveWalkApiSurface;
  tokenStore?: TokenStore;
}) {
  const [state, setState] = useState<AuthState>('restoring');
  const [token, setToken] = useState('');
  const [user, setUser] = useState<Traveler>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const expire = useCallback(() => {
    tokenStore.clear();
    setToken('');
    setUser(undefined);
    setState('anonymous');
  }, [tokenStore]);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      const saved = tokenStore.read();
      if (!saved) {
        if (active) setState('anonymous');
        return;
      }
      try {
        const data = await apiClient.me(saved);
        if (!active) return;
        setToken(saved);
        setUser(data.user);
        setState('authenticated');
      } catch {
        if (active) expire();
      }
    };
    void restore();
    return () => { active = false; };
  }, [apiClient, expire, tokenStore]);

  const acceptSession = useCallback((nextToken: string, nextUser: Traveler) => {
    tokenStore.write(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setState('authenticated');
  }, [tokenStore]);

  const authenticate = useCallback(async (mode: 'login' | 'register', payload: { name?: string; email: string; password: string }) => {
    setBusy(true);
    setError('');
    try {
      const data = mode === 'login'
        ? await apiClient.login({ email: payload.email, password: payload.password })
        : await apiClient.register({ name: payload.name || '', email: payload.email, password: payload.password });
      acceptSession(data.token, data.user);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Authentication failed.');
      return false;
    } finally {
      setBusy(false);
    }
  }, [acceptSession, apiClient]);

  const login = useCallback((email: string, password: string) => authenticate('login', { email, password }), [authenticate]);
  const register = useCallback((name: string, email: string, password: string) => authenticate('register', { name, email, password }), [authenticate]);

  const signOut = useCallback(async () => {
    setBusy(true);
    try {
      if (token) await apiClient.logout(token);
    } catch (reason) {
      if (!(reason instanceof ApiError && reason.status === 401)) console.warn('Logout request did not complete; local session was cleared.');
    } finally {
      expire();
      setError('');
      setBusy(false);
    }
  }, [apiClient, expire, token]);

  const value = useMemo<AuthContextValue>(() => ({ state, token, user, busy, error, login, register, signOut, expire }), [state, token, user, busy, error, login, register, signOut, expire]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
