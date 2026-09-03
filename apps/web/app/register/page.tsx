'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { LedgerLabel, LedgerInput } from '@/components/ui/ledger-field';

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // POST /auth/register es público -> se llama directo al backend, sin
      // pasar por el BFF (no hay tokens involucrados en esta respuesta).
      await apiFetch('/auth/register', null, {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      // Auto-login tras registrar: mejor UX que mandar a /login a escribir
      // las mismas credenciales de nuevo.
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string | string[] } | null;
        const message = Array.isArray(body?.message)
          ? body.message.join(', ')
          : (body?.message ?? 'No se pudo crear la cuenta');
        setError(message);
      } else {
        setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    // Nota pendiente (sin resolver todavía): Login usa el concepto "Premium
    // Dark / Console" (oscuro, a propósito). Este registro sigue en modo
    // claro -- es la misma pregunta abierta de la vez pasada: ¿el registro
    // debería ser la "puerta clara" hacia el dashboard, o debería heredar el
    // mismo tratamiento oscuro que Login por ser parte del mismo flujo?
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-9 flex flex-col items-center gap-3">
          <svg width="20" height="18" viewBox="0 0 20 18" fill="none" aria-hidden>
            <rect x="0" y="11" width="4" height="7" rx="1" fill="var(--primary)" opacity="0.55" />
            <rect x="8" y="6" width="4" height="12" rx="1" fill="var(--primary)" opacity="0.8" />
            <rect x="16" y="0" width="4" height="18" rx="1" fill="var(--primary)" />
          </svg>
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight">Crear cuenta</h1>
            <p className="text-sm text-muted-foreground">Empezá con FinanceApi</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="mb-5 grid grid-cols-2 gap-6">
            <div>
              <LedgerLabel>NOMBRE</LedgerLabel>
              <LedgerInput
                id="firstName"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <LedgerLabel>APELLIDO</LedgerLabel>
              <LedgerInput
                id="lastName"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-5">
            <LedgerLabel>EMAIL</LedgerLabel>
            <LedgerInput
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <LedgerLabel>CONTRASEÑA</LedgerLabel>
            <LedgerInput
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
          </div>

          {error && (
            <p className="mb-5 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
