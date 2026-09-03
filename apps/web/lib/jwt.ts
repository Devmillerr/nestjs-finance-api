export interface AccessTokenPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

// Decodifica el payload de un JWT sin verificar la firma. Esto NUNCA debe
// usarse para decisiones de autorización -- el backend siempre revalida el
// token real en cada request. Acá solo sirve para mostrar datos en la UI
// (ej. "sesión expira en...") sin tener que pegarle a la API para eso.
export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as AccessTokenPayload;
  } catch {
    return null;
  }
}
