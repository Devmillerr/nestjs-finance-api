import { NextRequest, NextResponse } from 'next/server';
import { API_URL, REFRESH_COOKIE_NAME, refreshCookieOptions } from '@/lib/config';

export async function POST(request: NextRequest) {
  const body = await request.json();

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
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

  const response = NextResponse.json({ accessToken: data.accessToken });
  response.cookies.set(REFRESH_COOKIE_NAME, data.refreshToken, refreshCookieOptions);
  return response;
}
