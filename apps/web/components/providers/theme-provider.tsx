'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Provider de tema propio, sin dependencias nuevas.
//
// globals.css ya traía un bloque .dark completo desde antes, pero la interfaz
// no tenía ningún control para activarlo (hallazgo #9 de la auditoría). Esto
// es lo mínimo para encenderlo: no se agrega next-themes al package.json por
// un toggle de 40 líneas.
//
// El script inline de app/layout.tsx aplica la clase antes del primer paint,
// así que no hay flash de tema claro al recargar.

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'financeapi.theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Arranca leyendo la clase que ya puso el script inline, así el primer
  // render del cliente coincide con el HTML servido.
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    apply(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Modo privado o storage bloqueado: el tema vale para esta sesión.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  // Sigue la preferencia del sistema mientras el usuario no haya elegido.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored === 'light' || stored === 'dark') return;

    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const next: Theme = e.matches ? 'light' : 'dark';
      setThemeState(next);
      apply(next);
    };
    onChange(mq);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}

/**
 * Script que corre antes del primer paint para evitar el flash de tema.
 * Se inyecta desde app/layout.tsx.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('${STORAGE_KEY}');var d=s?s==='dark':!window.matchMedia('(prefers-color-scheme: light)').matches;var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(err){document.documentElement.classList.add('dark');}})();`;
