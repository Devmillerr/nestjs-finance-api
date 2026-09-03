import { NextRequest, NextResponse } from 'next/server';
import { API_URL, REFRESH_COOKIE_NAME, refreshCookieOptions } from '@/lib/config';

export async function POST(request: NextRequest) {
  const body = await request.json();

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // El backend está caído o no llegó a responder -- sin este catch, el
    // fetch fallido tira una excepción sin manejar y Next devuelve un 500
    // con body vacío, que el cliente no puede parsear como JSON.
    return NextResponse.json(
      { message: 'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.' },
      { status: 502 },
    );
  }

  const data = await backendResponse.json().catch(() => null);
  if (!backendResponse.ok || data === null) {
    return NextResponse.json(
      data ?? { message: 'Respuesta inválida del servidor' },
      { status: backendResponse.ok ? 502 : backendResponse.status },
    );
  }

  // El refresh token nunca llega al navegador como JSON -- se queda acá,
  // seteado como cookie httpOnly. El cliente solo recibe el access token,
  // que se guarda en memoria (nunca en localStorage).
  const response = NextResponse.json({ accessToken: data.accessToken });
  response.cookies.set(REFRESH_COOKIE_NAME, data.refreshToken, refreshCookieOptions);
  return response;
}
