'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { decodeAccessToken, type AccessTokenPayload } from '@/lib/jwt';
import { apiFetch, ApiError } from '@/lib/api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AccessTokenPayload | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // Wrapper de apiFetch que ya conoce el access token actual y reintenta
  // una vez tras un refresh silencioso si el backend devuelve 401 (el
  // access token pudo haber expirado justo en el medio del request).
  authFetch: (path: string, init?: RequestInit) => Promise<unknown>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>('loading');
  // El access token vive en un ref (no en state) para que authFetch siempre
  // lea el valor más actual sin quedar atrapado en un closure viejo, pero
  // también se refleja en `user` (state) para que la UI re-renderice.
  const accessTokenRef = useRef<string | null>(null);
  const [user, setUser] = useState<AccessTokenPayload | null>(null);

  const setSession = useCallback((accessToken: string | null) => {
    accessTokenRef.current = accessToken;
    setUser(accessToken ? decodeAccessToken(accessToken) : null);
    setStatus(accessToken ? 'authenticated' : 'unauthenticated');
  }, []);

  const silentRefresh = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      if (!res.ok) {
        setSession(null);
        return null;
      }
      const data = await res.json();
      setSession(data.accessToken);
      return data.accessToken as string;
    } catch {
      setSession(null);
      return null;
    }
  }, [setSession]);

  // Al montar la app: intenta recuperar sesión a partir de la cookie
  // httpOnly (el usuario cierra la pestaña con sesión activa, la vuelve a
  // abrir, y no debería tener que loguearse de nuevo). silentRefresh es
  // async -> el setState real ocurre en su continuación, no de forma
  // síncrona dentro del efecto; es el patrón estándar de "chequeo de sesión
  // al montar", no un efecto que debería reemplazarse por render-time logic.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chequeo de sesión al montar; el setState real ocurre en la continuación async de silentRefresh, no de forma síncrona en el cuerpo del efecto.
    void silentRefresh();
  }, [silentRefresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? 'No se pudo iniciar sesión');
      }
      setSession(data.accessToken);
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setSession(null);
    router.push('/login');
  }, [router, setSession]);

  const authFetch = useCallback(
    async (path: string, init: RequestInit = {}) => {
      try {
        return await apiFetch(path, accessTokenRef.current, init);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          const newToken = await silentRefresh();
          if (newToken) {
            return apiFetch(path, newToken, init);
          }
          router.push('/login');
        }
        throw err;
      }
    },
    [router, silentRefresh],
  );

  return (
    <AuthContext.Provider value={{ status, user, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
