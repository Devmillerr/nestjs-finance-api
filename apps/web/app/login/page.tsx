'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [focusField, setFocusField] = useState<'email' | 'password' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    // Rediseño "Login oscuro / split screen": paleta propia (carbón #0D0D0D +
    // acento verde menta #00F59B), independiente de los tokens --primary del
    // resto de la app (que son azules -- ver globals.css). Es la puerta de
    // entrada, un momento oscuro deliberado, no el tema del dashboard.
    <div className="grid min-h-screen grid-cols-1 bg-[#0D0D0D] font-sans text-[#F2F4F0] lg:grid-cols-2">
      <style>{`
        @keyframes login-fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes login-glow { 0%, 100% { opacity: .5; } 50% { opacity: .9; } }
      `}</style>

      <aside className="relative flex min-h-[260px] flex-col justify-center overflow-hidden border-b border-white/[0.06] bg-[#0A0B0A] px-11 py-12 lg:border-b-0 lg:border-r">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[-20%] bottom-[-40%] h-[70%]"
          style={{
            background:
              'radial-gradient(ellipse at 50% 100%, rgba(0,245,155,.16), rgba(0,245,155,0) 68%)',
            animation: 'login-glow 9s ease-in-out infinite',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.022) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at 30% 20%, #000, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 30% 20%, #000, transparent 75%)',
          }}
        />

        <div className="absolute left-11 top-12 flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-[11px] bg-[#00F59B] text-[15px] font-bold tracking-[-0.02em] text-[#0B0F0A] shadow-[0_0_0_1px_rgba(0,245,155,.35),0_8px_28px_rgba(0,245,155,.18)]">
            Fx
          </div>
          <span className="text-[16px] font-semibold tracking-[-0.01em]">FinanceApi</span>
        </div>

        <div
          className="relative -mt-7 max-w-[460px]"
          style={{ animation: 'login-fade-up .7s cubic-bezier(.2,.7,.2,1) both' }}
        >
          <h1 className="m-0 text-pretty text-[clamp(32px,4.2vw,50px)] font-semibold leading-[1.04] tracking-[-0.035em]">
            Tus finanzas,
            <br />
            <span className="text-[#00F59B]">en una sola API</span>
          </h1>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-[400px]"
          style={{ animation: 'login-fade-up .6s cubic-bezier(.2,.7,.2,1) both .1s' }}
        >
          <h2 className="mb-7 text-[27px] font-semibold tracking-[-0.025em]">Bienvenido</h2>

          {/* Sin backend de Google OAuth todavía -- el botón queda visual, sin acción. */}
          <button
            type="button"
            onClick={() => {}}
            className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] border border-white/[0.16] bg-[#1E1E1E] text-[15px] font-medium text-[#F2F4F0] transition-colors duration-200 ease-out hover:border-[#00F59B]/50 hover:bg-[#262626] hover:shadow-[0_0_0_4px_rgba(0,245,155,.07)] active:scale-[0.985]"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C41 35.5 44 30.2 44 24c0-1.3-.1-2.6-.4-3.9z"
              />
            </svg>
            Continuar con Google
          </button>

          <div className="my-[30px] h-px bg-gradient-to-r from-transparent via-white/[0.14] to-transparent" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
            <label className="flex flex-col gap-2">
              <span
                className="font-mono text-[10.5px] uppercase tracking-[0.14em] transition-colors duration-200"
                style={{ color: focusField === 'email' ? '#00F59B' : '#A2A89D' }}
              >
                Email
              </span>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusField('email')}
                onBlur={() => setFocusField(null)}
                placeholder="tu@empresa.com"
                className="h-[52px] rounded-[14px] border border-white/[0.22] bg-[#141714] px-4 text-[15px] text-[#F2F4F0] outline-none transition-colors duration-200 placeholder:text-[#5A5F58] hover:border-white/[0.34] focus:border-[#00F59B] focus:bg-[#161A14] focus:shadow-[0_0_0_4px_rgba(0,245,155,.14)]"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="flex items-baseline justify-between">
                <span
                  className="font-mono text-[10.5px] uppercase tracking-[0.14em] transition-colors duration-200"
                  style={{ color: focusField === 'password' ? '#00F59B' : '#A2A89D' }}
                >
                  Contraseña
                </span>
                <a
                  href="#"
                  className="text-[10.5px] tracking-[0.06em] text-[#8E948A] transition-colors hover:text-[#00F59B]"
                >
                  ¿La olvidaste?
                </a>
              </span>
              <span className="relative block">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusField('password')}
                  onBlur={() => setFocusField(null)}
                  placeholder="••••••••"
                  className="h-[52px] w-full rounded-[14px] border border-white/[0.22] bg-[#141714] pl-4 pr-[54px] text-[15px] text-[#F2F4F0] outline-none transition-colors duration-200 hover:border-white/[0.34] focus:border-[#00F59B] focus:bg-[#161A14] focus:shadow-[0_0_0_4px_rgba(0,245,155,.14)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-2 top-1/2 grid size-[38px] -translate-y-1/2 place-items-center rounded-[10px] text-[#7C827A] transition-colors duration-200 hover:bg-[#00F59B]/[0.08] hover:text-[#00F59B]"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  >
                    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="2.8" />
                  </svg>
                </button>
              </span>
            </label>

            <button
              type="button"
              onClick={() => setRemember((v) => !v)}
              aria-pressed={remember}
              className="-mt-0.5 flex items-center gap-2.5 text-[13.5px] text-[#9AA096]"
            >
              <span
                className="grid size-[18px] flex-none place-items-center rounded-[6px] border transition-colors duration-200"
                style={{
                  borderColor: remember ? '#00F59B' : 'rgba(255,255,255,.18)',
                  background: remember ? '#00F59B' : '#141714',
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ opacity: remember ? 1 : 0, transition: 'opacity .15s ease' }}
                >
                  <path d="M20 6.5 9 17.5 4 12.5" />
                </svg>
              </span>
              Mantener la sesión abierta
            </button>

            {error && <p className="text-[12.5px] text-[#E07A82]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-[54px] items-center justify-center gap-2.5 rounded-[14px] border border-[#00F59B] bg-black text-[15.5px] font-bold tracking-[-0.01em] text-[#00F59B] transition-all duration-200 ease-out hover:bg-[#00F59B]/10 hover:shadow-[0_0_0_4px_rgba(0,245,155,.07)] active:scale-[0.99] active:bg-[#00F59B]/[0.14] disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? 'Verificando' : 'Iniciar sesión'}
              {loading && (
                <span className="size-[15px] animate-spin rounded-full border-2 border-[#00F59B]/30 border-t-[#00F59B]" />
              )}
            </button>
          </form>

          <p className="mt-[26px] text-center text-[13.5px] text-[#8E948A]">
            ¿Aún no tienes cuenta?{' '}
            <Link href="/register" className="font-medium text-[#00F59B] hover:text-[#5BFFC4]">
              Regístrate
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
