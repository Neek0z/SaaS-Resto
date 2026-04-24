import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "maison-severe-theme";

function readInitial(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

// Apply synchronously on module import to avoid FOUC.
apply(readInitial());

const listeners = new Set<(t: Theme) => void>();

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readInitial);

  useEffect(() => {
    const fn = (t: Theme) => setThemeState(t);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const setTheme = (t: Theme) => {
    apply(t);
    window.localStorage.setItem(STORAGE_KEY, t);
    listeners.forEach((l) => l(t));
  };

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  return { theme, setTheme, toggle };
}
