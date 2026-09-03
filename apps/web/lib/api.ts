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
