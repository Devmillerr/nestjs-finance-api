import { NextRequest, NextResponse } from 'next/server';
import { API_URL, REFRESH_COOKIE_NAME, refreshCookieOptions } from '@/lib/config';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: 'No hay sesión activa' }, { status: 401 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return NextResponse.json(
      { message: 'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.' },
      { status: 502 },
    );
  }

  const data = await backendResponse.json().catch(() => null);
  if (!backendResponse.ok || data === null) {
    if (data === null) {
      return NextResponse.json(
        { message: 'Respuesta inválida del servidor' },
        { status: 502 },
      );
    }
    // El refresh falló (expirado, revocado, o reuso detectado) -> se limpia
    // la cookie acá también, no solo en el backend. Sin esto, el cliente
    // seguiría reintentando con un token que el backend ya invalidó.
    const response = NextResponse.json(data, { status: backendResponse.status });
    response.cookies.delete(REFRESH_COOKIE_NAME);
    return response;
  }

  // Rotación: el refresh token viejo se reemplaza acá también, en la
  // cookie -- coherente con la rotación que ya hace el backend en su tabla
  // refresh_tokens.
  const response = NextResponse.json({ accessToken: data.accessToken });
  response.cookies.set(REFRESH_COOKIE_NAME, data.refreshToken, refreshCookieOptions);
  return response;
}
