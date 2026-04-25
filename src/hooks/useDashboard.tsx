import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchDashboardData, type DashboardData } from "@/lib/api/dashboard";
import { extractErrorMessage } from "@/lib/errors";

function translateError(e: unknown): string {
  const msg = extractErrorMessage(e);
  const lower = msg.toLowerCase();
  if (lower.includes("row level security") || lower.includes("permission")) {
    return "Accès refusé. Vérifiez que vous êtes connecté.";
  }
  if (lower.includes("not configured") || lower.includes("non configur")) {
    return "Supabase non configuré.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Connexion réseau indisponible.";
  }
  return msg;
}

type UseDashboard = {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useDashboard(): UseDashboard {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (!restaurantId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const d = await fetchDashboardData();
      if (!mounted.current) return;
      setData(d);
    } catch (e) {
      if (mounted.current) setError(translateError(e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { data, loading, error, reload: load };
}

const DashboardCtx = createContext<UseDashboard | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const value = useDashboard();
  return <DashboardCtx.Provider value={value}>{children}</DashboardCtx.Provider>;
}

export function useDashboardCtx(): UseDashboard {
  const ctx = useContext(DashboardCtx);
  if (!ctx) throw new Error("useDashboardCtx must be used within DashboardProvider");
  return ctx;
}
