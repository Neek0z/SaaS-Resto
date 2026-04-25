import { useEffect, useState } from "react";

const STORAGE_KEY = "maison-severe-sidebar";

function readInitial(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

const listeners = new Set<(c: boolean) => void>();

export function useSidebar() {
  const [collapsed, setCollapsedState] = useState<boolean>(readInitial);

  useEffect(() => {
    const fn = (c: boolean) => setCollapsedState(c);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const setCollapsed = (c: boolean) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, c ? "1" : "0");
    }
    listeners.forEach((l) => l(c));
  };

  const toggle = () => setCollapsed(!collapsed);

  return { collapsed, setCollapsed, toggle };
}

export const SIDEBAR_WIDTHS = {
  expanded: 240,
  collapsed: 68,
} as const;
