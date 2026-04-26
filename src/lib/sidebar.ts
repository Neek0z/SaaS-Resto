import { useEffect, useState } from "react";

const STORAGE_KEY = "maison-severe-sidebar";

function readInitial(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

const collapsedListeners = new Set<(c: boolean) => void>();
const mobileListeners = new Set<(c: boolean) => void>();
let mobileOpenState = false;

export function useSidebar() {
  const [collapsed, setCollapsedState] = useState<boolean>(readInitial);
  const [mobileOpen, setMobileOpenState] = useState<boolean>(mobileOpenState);

  useEffect(() => {
    const fnC = (c: boolean) => setCollapsedState(c);
    const fnM = (c: boolean) => setMobileOpenState(c);
    collapsedListeners.add(fnC);
    mobileListeners.add(fnM);
    return () => {
      collapsedListeners.delete(fnC);
      mobileListeners.delete(fnM);
    };
  }, []);

  const setCollapsed = (c: boolean) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, c ? "1" : "0");
    }
    collapsedListeners.forEach((l) => l(c));
  };

  const toggle = () => setCollapsed(!collapsed);

  const setMobileOpen = (c: boolean) => {
    mobileOpenState = c;
    mobileListeners.forEach((l) => l(c));
  };

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return { collapsed, setCollapsed, toggle, mobileOpen, setMobileOpen, toggleMobile };
}

export const SIDEBAR_WIDTHS = {
  expanded: 240,
  collapsed: 68,
} as const;
