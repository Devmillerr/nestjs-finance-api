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
import type { NavViewer } from '@/lib/nav';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AccessTokenPayload | null;
  // Rol + permisos actuales, resueltos por el backend vía GET /auth/me (no
  // vienen en el JWT -- ver la nota en lib/jwt.ts sobre por qué). null
  // mientras se resuelve o si falló la carga; navGroupsFor(null) ya trata
  // ese caso como "sin gating todavía", así que no hace falta un tercer
  // estado de carga separado acá.
  viewer: NavViewer | null;
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
  const [viewer, setViewer] = useState<NavViewer | null>(null);

  const setSession = useCallback((accessToken: string | null) => {
    accessTokenRef.current = accessToken;
    setUser(accessToken ? decodeAccessToken(accessToken) : null);
    setStatus(accessToken ? 'authenticated' : 'unauthenticated');

    if (!accessToken) {
      setViewer(null);
      return;
    }

    // Fire-and-forget: la navegación se gatea por rol/permiso apenas estén
    // disponibles, pero no hace falta bloquear el login/refresh esperando
    // esta respuesta -- mientras tanto navGroupsFor(null) muestra todo,
    // igual que antes de que este endpoint existiera.
    void apiFetch('/auth/me', accessToken)
      .then((data) => setViewer(data as NavViewer))
      .catch(() => setViewer(null));
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
      let res: Response;
      try {
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
      } catch {
        // El fetch en sí falló (sin red, servidor de Next caído) -- nunca el
        // texto crudo del navegador acá, que no significa nada para el
        // usuario final.
        throw new Error('No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.');
      }
      const data = await res.json();
      if (!res.ok) {
        // data.message es el mensaje real del backend (ver AllExceptionsFilter,
        // apps/api) -- ya pensado para mostrarse, string o array de
        // class-validator.
        const message = Array.isArray(data.message) ? data.message.join(' ') : data.message;
        throw new Error(message ?? 'No se pudo iniciar sesión');
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
    <AuthContext.Provider value={{ status, user, viewer, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
