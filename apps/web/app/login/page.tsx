'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Se calcula solo en cliente (useEffect), nunca durante el render inicial:
  // new Date() en el render directo corre también en el servidor y produce
  // una hora distinta a la del cliente -> mismatch de hidratación de React.
  const [sessionTime, setSessionTime] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- patrón recomendado por React para valores que solo existen en cliente (evitar hydration mismatch): placeholder estable en el render inicial, valor real seteado tras montar.
    setSessionTime(
      new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    );
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    // Concepto "Premium Dark / Console" (elegido en la exploración de 4
    // conceptos): el único momento oscuro deliberado del producto -- una
    // puerta de entrada, no una inconsistencia con el resto del dashboard
    // (Studio Fintech, claro). Reutiliza la variante .dark que ya existe en
    // globals.css, no inventa tokens nuevos.
    <div className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      {/* Glow radial único y contenido detrás del logo -- a propósito NO es
          un wash de gradiente sobre toda la página (el cliché genérico de
          "fondo casi negro + acento neón"). */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[38%] size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[60px]"
        style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-[340px]">
        <div className="mb-9 flex items-center justify-between font-mono text-[10.5px] tracking-wide text-muted-foreground">
          <span>FINANCEAPI</span>
          <span>SESIÓN SEGURA</span>
        </div>

        <div className="mb-9 flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg border border-primary font-mono text-[13px] font-semibold text-primary">
            Fx
          </div>
          <span className="text-[15px] font-semibold text-foreground">FinanceApi</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="mb-5">
            <label
              htmlFor="email"
              className="mb-2 block font-mono text-[10.5px] tracking-wide text-muted-foreground"
            >
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              className="w-full border-0 border-b border-border bg-transparent py-1.5 font-mono text-[14.5px] text-foreground outline-none transition-colors duration-150 ease-[var(--ease-out)] placeholder:text-muted-foreground/50 focus:border-primary"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-2 block font-mono text-[10.5px] tracking-wide text-muted-foreground"
            >
              CONTRASEÑA
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-0 border-b border-border bg-transparent py-1.5 font-mono text-[14.5px] text-foreground outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-primary"
            />
          </div>

          {error && (
            <p className="mb-5 font-mono text-[12.5px] text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-md border border-primary font-mono text-[13.5px] text-primary transition-all duration-150 ease-[var(--ease-out)] hover:bg-primary hover:text-primary-foreground active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? 'Verificando…' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-10 flex items-center justify-between font-mono text-[11px] text-muted-foreground/70">
          <span>{sessionTime ?? '—:—'} · v3.0</span>
          <Link href="/register" className="text-primary hover:underline">
            Registrate
          </Link>
        </div>
      </div>
    </div>
  );
}
