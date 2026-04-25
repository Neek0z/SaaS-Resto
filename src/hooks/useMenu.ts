import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  deleteItemPhoto,
  fetchMenu,
  reorderCategories,
  reorderItems,
  updateCategory,
  updateItem,
  type NewItem,
} from "@/lib/api/menu-db";
import type { MenuCategory, MenuItem } from "@/lib/menu-types";
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
  if (lower.includes("duplicate key")) {
    return "Cet élément existe déjà.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Connexion réseau indisponible.";
  }
  return msg;
}

type UseMenu = {
  categories: MenuCategory[];
  items: MenuItem[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  addCategory: (name: string) => Promise<MenuCategory | null>;
  renameCategory: (id: string, name: string) => Promise<void>;
  toggleCategoryActive: (id: string, active: boolean) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  reorderCats: (ids: string[]) => Promise<void>;
  addItem: (payload: NewItem) => Promise<MenuItem | null>;
  editItem: (id: string, patch: Partial<Omit<MenuItem, "id" | "restaurantId">>) => Promise<void>;
  toggleAvailable: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  reorderIts: (categoryId: string, ids: string[]) => Promise<void>;
};

export function useMenu(): UseMenu {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (!restaurantId) {
      setCategories([]);
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { categories: c, items: i } = await fetchMenu(restaurantId);
      if (!mounted.current) return;
      setCategories(c);
      setItems(i);
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

  const addCategory = useCallback(
    async (name: string): Promise<MenuCategory | null> => {
      if (!restaurantId) return null;
      const position = categories.length;
      try {
        const created = await createCategory(restaurantId, name, position);
        setCategories((prev) => [...prev, created]);
        return created;
      } catch (e) {
        setError(translateError(e));
        return null;
      }
    },
    [categories.length, restaurantId]
  );

  const renameCategory = useCallback(async (id: string, name: string) => {
    const before = categories;
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
    try {
      await updateCategory(id, { name });
    } catch (e) {
      setCategories(before);
      setError(translateError(e));
    }
  }, [categories]);

  const toggleCategoryActive = useCallback(async (id: string, active: boolean) => {
    const before = categories;
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)));
    try {
      await updateCategory(id, { active });
    } catch (e) {
      setCategories(before);
      setError(translateError(e));
    }
  }, [categories]);

  const removeCategory = useCallback(async (id: string) => {
    const beforeCats = categories;
    const beforeItems = items;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setItems((prev) => prev.filter((i) => i.categoryId !== id));
    try {
      await deleteCategory(id);
    } catch (e) {
      setCategories(beforeCats);
      setItems(beforeItems);
      setError(translateError(e));
    }
  }, [categories, items]);

  const reorderCats = useCallback(async (ids: string[]) => {
    const before = categories;
    setCategories((prev) => {
      const byId = new Map(prev.map((c) => [c.id, c] as const));
      return ids.map((id, idx) => ({ ...(byId.get(id) as MenuCategory), position: idx }));
    });
    try {
      await reorderCategories(ids);
    } catch (e) {
      setCategories(before);
      setError(translateError(e));
    }
  }, [categories]);

  const addItem = useCallback(async (payload: NewItem): Promise<MenuItem | null> => {
    if (!restaurantId) return null;
    const position = items.filter((i) => i.categoryId === payload.categoryId).length;
    try {
      const created = await createItem(restaurantId, { ...payload, position });
      setItems((prev) => [...prev, created]);
      return created;
    } catch (e) {
      setError(translateError(e));
      return null;
    }
  }, [items, restaurantId]);

  const editItem = useCallback(
    async (id: string, patch: Partial<Omit<MenuItem, "id" | "restaurantId">>) => {
      const before = items;
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
      try {
        await updateItem(id, patch);
      } catch (e) {
        setItems(before);
        setError(translateError(e));
      }
    },
    [items]
  );

  const toggleAvailable = useCallback(async (id: string) => {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    const next = !current.available;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, available: next } : i)));
    try {
      await updateItem(id, { available: next });
    } catch (e) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, available: !next } : i)));
      setError(translateError(e));
    }
  }, [items]);

  const removeItem = useCallback(async (id: string) => {
    const victim = items.find((i) => i.id === id);
    if (!victim) return;
    const before = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteItem(id);
      if (victim.photoUrl) await deleteItemPhoto(victim.photoUrl);
    } catch (e) {
      setItems(before);
      setError(translateError(e));
    }
  }, [items]);

  const reorderIts = useCallback(async (categoryId: string, ids: string[]) => {
    const before = items;
    setItems((prev) => {
      const byId = new Map(prev.map((i) => [i.id, i] as const));
      const reordered = ids.map((id, idx) => ({
        ...(byId.get(id) as MenuItem),
        position: idx,
      }));
      const others = prev.filter((i) => i.categoryId !== categoryId);
      return [...others, ...reordered];
    });
    try {
      await reorderItems(ids);
    } catch (e) {
      setItems(before);
      setError(translateError(e));
    }
  }, [items]);

  return {
    categories,
    items,
    loading,
    error,
    reload: load,
    addCategory,
    renameCategory,
    toggleCategoryActive,
    removeCategory,
    reorderCats,
    addItem,
    editItem,
    toggleAvailable,
    removeItem,
    reorderIts,
  };
}
