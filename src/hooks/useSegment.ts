import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllCustomers } from "@/lib/api/customers-db";
import { supabase } from "@/lib/supabase";
import {
  customerMatches,
  type Customer,
  type SegmentFilters,
} from "@/lib/crm-types";

// Hook qui charge tous les clients du restaurant et applique les filtres
// du segment côté client (la base reste raisonnable : <50k clients).
export function useSegment(filters: SegmentFilters) {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;

  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loyaltyTierByLoyaltyId, setLoyaltyTierByLoyaltyId] = useState<
    Map<string, string>
  >(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!restaurantId) {
        setAllCustomers([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const list = await fetchAllCustomers(restaurantId);
        if (!cancelled) setAllCustomers(list);

        // Charge tier des loyalty_customers liés
        const ids = list
          .map((c) => c.loyaltyCustomerId)
          .filter((id): id is string => Boolean(id));
        if (ids.length > 0 && supabase) {
          const { data } = await supabase
            .from("loyalty_customers")
            .select("id, tier")
            .in("id", ids);
          if (!cancelled && data) {
            const map = new Map<string, string>();
            for (const row of data as { id: string; tier: string }[]) {
              map.set(row.id, row.tier);
            }
            setLoyaltyTierByLoyaltyId(map);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const matched = useMemo(
    () =>
      allCustomers.filter((c) =>
        customerMatches(c, filters, loyaltyTierByLoyaltyId)
      ),
    [allCustomers, filters, loyaltyTierByLoyaltyId]
  );

  return {
    matched,
    count: matched.length,
    total: allCustomers.length,
    loading,
  };
}
