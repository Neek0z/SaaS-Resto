import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createOrder,
  deleteOrder,
  listOrders,
  updateOrder,
  updateOrderStatus,
} from "@/lib/api/orders";
import type { NewOrder, Order, OrderPatch, OrderStatus } from "@/lib/order-types";
import { extractErrorMessage } from "@/lib/errors";

function translateError(e: unknown): string {
  const msg = extractErrorMessage(e);
  const lower = msg.toLowerCase();
  if (lower.includes("row level security") || lower.includes("permission")) {
    return "Accès refusé. Vérifiez votre rôle.";
  }
  if (lower.includes("not configured") || lower.includes("non configur")) {
    return "Supabase non configuré.";
  }
  if (lower.includes("duplicate key")) {
    return "Cette référence de commande existe déjà.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Connexion réseau indisponible.";
  }
  return msg;
}

type UseOrders = {
  orders: Order[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  add: (input: NewOrder) => Promise<Order | null>;
  update: (id: string, patch: OrderPatch) => Promise<void>;
  setStatus: (id: string, status: OrderStatus) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export function useOrders(): UseOrders {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (!restaurantId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await listOrders();
      if (!mounted.current) return;
      setOrders(rows);
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

  const add = useCallback(async (input: NewOrder): Promise<Order | null> => {
    try {
      const created = await createOrder(input);
      setOrders((prev) => [created, ...prev]);
      return created;
    } catch (e) {
      setError(translateError(e));
      return null;
    }
  }, []);

  const setStatus = useCallback(async (id: string, status: OrderStatus) => {
    const before = orders;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await updateOrderStatus(id, status);
    } catch (e) {
      setOrders(before);
      setError(translateError(e));
    }
  }, [orders]);

  const update = useCallback(async (id: string, patch: OrderPatch) => {
    const before = orders;
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...patch, items: patch.items ?? o.items } : o))
    );
    try {
      await updateOrder(id, patch);
    } catch (e) {
      setOrders(before);
      setError(translateError(e));
    }
  }, [orders]);

  const remove = useCallback(async (id: string) => {
    const before = orders;
    setOrders((prev) => prev.filter((o) => o.id !== id));
    try {
      await deleteOrder(id);
    } catch (e) {
      setOrders(before);
      setError(translateError(e));
    }
  }, [orders]);

  return {
    orders,
    loading,
    error,
    reload: load,
    add,
    update,
    setStatus,
    remove,
  };
}
