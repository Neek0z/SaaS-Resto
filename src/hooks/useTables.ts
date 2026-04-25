import { useCallback, useEffect, useRef, useState } from "react";
import {
  createTable,
  deleteTable,
  listTables,
  updateTable,
  type RestaurantTable,
  type TableZone,
} from "@/lib/api/restaurant-tables";
import { extractErrorMessage } from "@/lib/errors";

export type { RestaurantTable, TableZone } from "@/lib/api/restaurant-tables";

export type TableEntry = {
  id: string;
  number: string;
  capacity: number;
  zone: TableZone;
};

function toEntry(t: RestaurantTable): TableEntry {
  return { id: t.id, number: t.label, capacity: t.capacity, zone: t.zone };
}

export function useTables(restaurantId: string | null) {
  const [tables, setTables] = useState<TableEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    if (!restaurantId) {
      setTables([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await listTables(restaurantId);
      if (!mounted.current) return;
      setTables(rows.map(toEntry));
    } catch (e) {
      if (mounted.current) setError(extractErrorMessage(e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  const addTable = useCallback(
    async (label: string, capacity: number, zone: TableZone = "inside") => {
      const trimmed = label.trim();
      if (!trimmed) return;
      if (tables.some((t) => t.number === trimmed)) {
        setError("Cette table existe déjà.");
        return;
      }
      try {
        const created = await createTable({ label: trimmed, capacity, zone });
        setTables((prev) => [...prev, toEntry(created)].sort((a, b) => a.number.localeCompare(b.number)));
      } catch (e) {
        setError(extractErrorMessage(e));
      }
    },
    [tables]
  );

  const removeTable = useCallback(
    async (id: string) => {
      const before = tables;
      setTables((prev) => prev.filter((t) => t.id !== id));
      try {
        await deleteTable(id);
      } catch (e) {
        setTables(before);
        setError(extractErrorMessage(e));
      }
    },
    [tables]
  );

  const editTable = useCallback(
    async (
      id: string,
      patch: { label?: string; capacity?: number; zone?: TableZone }
    ) => {
      const before = tables;
      setTables((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                ...(patch.label !== undefined ? { number: patch.label } : {}),
                ...(patch.capacity !== undefined ? { capacity: patch.capacity } : {}),
                ...(patch.zone !== undefined ? { zone: patch.zone } : {}),
              }
            : t
        )
      );
      try {
        await updateTable(id, patch);
      } catch (e) {
        setTables(before);
        setError(extractErrorMessage(e));
      }
    },
    [tables]
  );

  return {
    tables,
    loading,
    error,
    addTable,
    removeTable,
    editTable,
    reload,
    clearError: () => setError(null),
  };
}
