import { useCallback, useEffect, useState } from "react";
import { fetchCustomerTransactions } from "@/lib/api/loyalty-db";
import type { LoyaltyTransaction } from "@/lib/loyalty-types";

export function useLoyaltyTransactions(customerId: string | null) {
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!customerId) {
      setTransactions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchCustomerTransactions(customerId);
      setTransactions(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec du chargement.");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { transactions, loading, error, reload };
}
