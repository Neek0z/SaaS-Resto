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
  active: boolean;
  displayOrder: number;
};

function toEntry(t: RestaurantTable): TableEntry {
  return {
    id: t.id,
    number: t.label,
    capacity: t.capacity,
    zone: t.zone,
    active: t.active,
    displayOrder: t.displayOrder,
  };
}

function sortEntries(list: TableEntry[]): TableEntry[] {
  return [...list].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.number.localeCompare(b.number)
  );
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
        setTables((prev) => sortEntries([...prev, toEntry(created)]));
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
      patch: {
        label?: string;
        capacity?: number;
        zone?: TableZone;
        active?: boolean;
        displayOrder?: number;
      }
    ) => {
      const before = tables;
      setTables((prev) =>
        sortEntries(
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...(patch.label !== undefined ? { number: patch.label } : {}),
                  ...(patch.capacity !== undefined ? { capacity: patch.capacity } : {}),
                  ...(patch.zone !== undefined ? { zone: patch.zone } : {}),
                  ...(patch.active !== undefined ? { active: patch.active } : {}),
                  ...(patch.displayOrder !== undefined
                    ? { displayOrder: patch.displayOrder }
                    : {}),
                }
              : t
          )
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

  const moveTable = useCallback(
    async (id: string, direction: "up" | "down") => {
      const idx = tables.findIndex((t) => t.id === id);
      if (idx === -1) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= tables.length) return;
      const a = tables[idx];
      const b = tables[swapIdx];
      const aOrder = a.displayOrder;
      const bOrder = b.displayOrder;
      // If both share the same displayOrder, normalize.
      const newAOrder = aOrder === bOrder ? swapIdx : bOrder;
      const newBOrder = aOrder === bOrder ? idx : aOrder;
      const before = tables;
      setTables((prev) =>
        sortEntries(
          prev.map((t) =>
            t.id === a.id
              ? { ...t, displayOrder: newAOrder }
              : t.id === b.id
              ? { ...t, displayOrder: newBOrder }
              : t
          )
        )
      );
      try {
        await Promise.all([
          updateTable(a.id, { displayOrder: newAOrder }),
          updateTable(b.id, { displayOrder: newBOrder }),
        ]);
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
    moveTable,
    reload,
    clearError: () => setError(null),
  };
}
