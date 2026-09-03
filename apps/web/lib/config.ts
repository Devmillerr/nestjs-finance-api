// Server-only: nunca se importa desde un Client Component. La URL del
// backend real (Nest + Supabase) nunca llega al navegador -- solo estos
// route handlers (el BFF) le hablan directo.
export const API_URL = process.env.API_URL ?? 'http://localhost:5050/api/v1';

export const REFRESH_COOKIE_NAME = 'financeapi_refresh';

// httpOnly: JavaScript del cliente nunca puede leer este valor (inmune a
// robo por XSS). secure solo en producción -- en local (http) rompería.
// sameSite lax: alcanza para un flujo same-site normal sin bloquear
// navegación top-level, sin abrir la puerta a CSRF cross-site.
export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 días, igual que JWT_REFRESH_EXPIRES_IN del backend
};
