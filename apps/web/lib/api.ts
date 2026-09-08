// A diferencia de /api/auth/*, este helper le habla DIRECTO al backend Nest
// desde el navegador (no pasa por el BFF) -- es seguro porque el access
// token vive solo en memoria (nunca en localStorage) y expira en 15 min.
// El backend ya tiene CORS_ORIGIN configurado para aceptar este origen.
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5050/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API error ${status}`);
  }
}

export async function apiFetch(
  path: string,
  accessToken: string | null,
  init: RequestInit = {},
): Promise<unknown> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }

  return body;
}

/**
 * Traduce cualquier error de un fetch (a este backend o al BFF de Next) a un
 * mensaje pensado para mostrarse tal cual al usuario final -- nunca
 * `err.message` crudo, que para un `ApiError` es solo `"API error 404"` (ver
 * el constructor de arriba) y para una falla de red es texto del navegador
 * (ej. "Failed to fetch"), ninguno de los dos accionable ni traducido.
 *
 * Distingue a propósito las 4 categorías que le importan al usuario:
 * - conexión/servidor: nunca hay nada útil que mostrar más que "reintentá".
 * - autorización (401/403): el backend puede responder con el default de
 *   Nest ("Forbidden resource", en inglés) cuando el guard no da un mensaje
 *   propio (ver RolesGuard/PermissionsGuard) -- se reemplaza siempre por
 *   una frase curada, nunca se pasa ese texto tal cual.
 * - no encontrado (404): idem, mensaje curado y consistente.
 * - validación/negocio (400/409/422...): acá sí se muestra el mensaje real
 *   del backend (`body.message`, string o array de class-validator) -- el
 *   AllExceptionsFilter del backend ya garantiza que ese texto es seguro de
 *   mostrar (nunca stack traces ni detalle interno; un 500 real llega como
 *   "Ocurrió un error inesperado", cubierto por la rama de abajo).
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return 'Tu sesión expiró. Iniciá sesión de nuevo.';
    }
    if (err.status === 403) {
      return 'No tenés permiso para realizar esta acción.';
    }
    if (err.status === 404) {
      return 'El recurso no existe o ya no está disponible.';
    }
    if (err.status >= 500) {
      return 'Hubo un problema en el servidor. Intentá de nuevo en unos minutos.';
    }
    const body = err.body as { message?: string | string[] } | null;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join(' ') : body.message;
    }
    return fallback;
  }
  if (err instanceof Error) {
    return 'No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.';
  }
  return fallback;
}
