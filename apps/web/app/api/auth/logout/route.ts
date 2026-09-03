import { NextRequest, NextResponse } from 'next/server';
import { API_URL, REFRESH_COOKIE_NAME } from '@/lib/config';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (refreshToken) {
    // Best-effort: si el backend ya está caído o el token ya venció, igual
    // queremos borrar la cookie local y dejar al usuario deslogueado del
    // lado del cliente.
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(REFRESH_COOKIE_NAME);
  return response;
}
