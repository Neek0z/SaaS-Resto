import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createCustomer,
  deleteCustomer,
  fetchAllTags,
  fetchCustomersPage,
  toggleCustomerOptIn,
  updateCustomer,
  type CustomerListParams,
} from "@/lib/api/customers-db";
import type { Customer, CustomerPayload } from "@/lib/crm-types";

const PAGE_SIZE = 50;

export function useCustomers(initialParams: CustomerListParams = {}) {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;

  const [rows, setRows] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialParams.page ?? 0);
  const [search, setSearch] = useState(initialParams.search ?? "");
  const [source, setSource] =
    useState<CustomerListParams["source"]>(initialParams.source ?? "all");
  const [optedInOnly, setOptedInOnly] = useState<boolean>(
    initialParams.optedInOnly ?? false
  );
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!restaurantId) {
      setRows([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCustomersPage(restaurantId, {
        search,
        source,
        optedInOnly,
        page,
        pageSize: PAGE_SIZE,
      });
      setRows(res.rows);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec du chargement.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, search, source, optedInOnly, page]);

  const reloadTags = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const list = await fetchAllTags(restaurantId);
      setTags(list);
    } catch {
      // silencieux
    }
  }, [restaurantId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    void reloadTags();
  }, [reloadTags]);

  const addCustomer = useCallback(
    async (payload: CustomerPayload): Promise<Customer | null> => {
      if (!restaurantId) return null;
      try {
        const created = await createCustomer(restaurantId, payload);
        await reload();
        await reloadTags();
        return created;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de la création.");
        return null;
      }
    },
    [restaurantId, reload, reloadTags]
  );

  const editCustomer = useCallback(
    async (id: string, payload: CustomerPayload): Promise<void> => {
      const before = rows;
      setRows((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...payload } : c))
      );
      try {
        await updateCustomer(id, payload);
        await reloadTags();
      } catch (e) {
        setRows(before);
        setError(e instanceof Error ? e.message : "Échec de la mise à jour.");
      }
    },
    [rows, reloadTags]
  );

  const toggleOptIn = useCallback(
    async (
      id: string,
      channel: "email" | "sms",
      value: boolean
    ): Promise<void> => {
      const before = rows;
      setRows((prev) =>
        prev.map((c) =>
          c.id === id
            ? channel === "email"
              ? { ...c, optedInEmail: value }
              : { ...c, optedInSms: value }
            : c
        )
      );
      try {
        await toggleCustomerOptIn(id, channel, value);
      } catch (e) {
        setRows(before);
        setError(e instanceof Error ? e.message : "Échec.");
      }
    },
    [rows]
  );

  const removeCustomer = useCallback(
    async (id: string): Promise<void> => {
      const before = rows;
      setRows((prev) => prev.filter((c) => c.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      try {
        await deleteCustomer(id);
      } catch (e) {
        setRows(before);
        setError(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    },
    [rows]
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );

  return {
    rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    setPage,
    search,
    setSearch: (v: string) => {
      setPage(0);
      setSearch(v);
    },
    source,
    setSource: (v: CustomerListParams["source"]) => {
      setPage(0);
      setSource(v);
    },
    optedInOnly,
    setOptedInOnly: (v: boolean) => {
      setPage(0);
      setOptedInOnly(v);
    },
    tags,
    loading,
    error,
    reload,
    reloadTags,
    addCustomer,
    editCustomer,
    toggleOptIn,
    removeCustomer,
    clearError: () => setError(null),
  };
}
