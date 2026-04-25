import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type SidebarCounters = {
  ordersInProgress: number;
  reservationsToday: number;
  loyaltyMembers: number;
};

const ZERO: SidebarCounters = {
  ordersInProgress: 0,
  reservationsToday: 0,
  loyaltyMembers: 0,
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchCount(
  table: string,
  filters: (q: any) => any
): Promise<number> {
  if (!supabase) return 0;
  const base = supabase.from(table).select("*", { count: "exact", head: true });
  const { count, error } = await filters(base);
  if (error) return 0;
  return count ?? 0;
}

export function useSidebarCounters(intervalMs = 30_000): SidebarCounters {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;
  const [counters, setCounters] = useState<SidebarCounters>(ZERO);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!restaurantId || !supabase) {
      setCounters(ZERO);
      return () => {
        mounted.current = false;
      };
    }

    const load = async () => {
      const [orders, resas, loyalty] = await Promise.all([
        fetchCount("orders", (q) =>
          q.eq("restaurant_id", restaurantId).in("status", ["pending", "preparing"])
        ),
        fetchCount("reservations", (q) =>
          q.eq("restaurant_id", restaurantId).eq("reservation_date", todayIso())
        ),
        fetchCount("loyalty_customers", (q) => q.eq("restaurant_id", restaurantId)),
      ]);
      if (!mounted.current) return;
      setCounters({
        ordersInProgress: orders,
        reservationsToday: resas,
        loyaltyMembers: loyalty,
      });
    };

    void load();
    const id = window.setInterval(load, intervalMs);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
  }, [restaurantId, intervalMs]);

  return counters;
}
