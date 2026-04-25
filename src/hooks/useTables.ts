import { useCallback, useEffect, useState } from "react";

export type TableEntry = {
  id: string;
  number: string;
  capacity: number;
};

const KEY_PREFIX = "severe.tables.";

function load(restaurantId: string): TableEntry[] {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + restaurantId);
    if (!raw) return defaultTables();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultTables();
    return parsed.filter(isTable);
  } catch {
    return defaultTables();
  }
}

function isTable(v: unknown): v is TableEntry {
  if (!v || typeof v !== "object") return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.number === "string" &&
    typeof t.capacity === "number"
  );
}

function defaultTables(): TableEntry[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `t${i + 1}`,
    number: String(i + 1),
    capacity: i < 4 ? 2 : 4,
  }));
}

function save(restaurantId: string, tables: TableEntry[]) {
  try {
    localStorage.setItem(KEY_PREFIX + restaurantId, JSON.stringify(tables));
  } catch {
    // Ignore storage failures (quota, private mode).
  }
}

export function useTables(restaurantId: string | null) {
  const [tables, setTables] = useState<TableEntry[]>([]);

  useEffect(() => {
    if (!restaurantId) {
      setTables([]);
      return;
    }
    setTables(load(restaurantId));
  }, [restaurantId]);

  const persist = useCallback(
    (next: TableEntry[]) => {
      if (restaurantId) save(restaurantId, next);
      setTables(next);
    },
    [restaurantId]
  );

  const addTable = useCallback(
    (number: string, capacity: number) => {
      const trimmed = number.trim();
      if (!trimmed) return;
      const exists = tables.some((t) => t.number === trimmed);
      if (exists) return;
      persist([
        ...tables,
        { id: `t_${Date.now().toString(36)}`, number: trimmed, capacity },
      ]);
    },
    [tables, persist]
  );

  const removeTable = useCallback(
    (id: string) => {
      persist(tables.filter((t) => t.id !== id));
    },
    [tables, persist]
  );

  return { tables, addTable, removeTable };
}
