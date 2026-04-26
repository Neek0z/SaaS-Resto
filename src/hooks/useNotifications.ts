import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type NotifKind = "reservation" | "avis" | "commande";

export type Notif = {
  id: string;
  kind: NotifKind;
  text: string;
  ago: string;
  createdAt: string;
  unread: boolean;
  href: string;
  state?: Record<string, unknown>;
};

const READ_KEY = "notif-read-ids:v1";

function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(READ_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore quota errors
  }
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  const date = new Date(iso);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayAgoIso(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return d.toISOString();
}

export function useNotifications() {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;
  const [items, setItems] = useState<Notif[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds());
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (!restaurantId || !supabase) {
      setItems([]);
      return;
    }
    const sb = supabase;

    const [resasRes, reviewsRes, ordersRes] = await Promise.all([
      sb
        .from("reservations")
        .select("id, reservation_date, reservation_time, name, covers, created_at")
        .eq("restaurant_id", restaurantId)
        .eq("status", "pending")
        .gte("reservation_date", todayIso())
        .order("created_at", { ascending: false })
        .limit(20),
      sb
        .from("reviews")
        .select("id, author, rating, scale, text, created_at, replied")
        .eq("restaurant_id", restaurantId)
        .eq("replied", false)
        .gte("created_at", dayAgoIso())
        .order("created_at", { ascending: false })
        .limit(20),
      sb
        .from("orders")
        .select("id, display_id, table_label, status, created_at")
        .eq("restaurant_id", restaurantId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const list: Notif[] = [];

    if (!resasRes.error) {
      for (const r of (resasRes.data ?? []) as Array<{
        id: string;
        reservation_date: string;
        reservation_time: string;
        name: string;
        covers: number;
        created_at: string;
      }>) {
        const id = `resa:${r.id}`;
        list.push({
          id,
          kind: "reservation",
          text: `${r.name} demande une table pour ${r.covers} couvert${r.covers > 1 ? "s" : ""} le ${r.reservation_date} à ${r.reservation_time.slice(0, 5)}`,
          ago: relativeTime(r.created_at),
          createdAt: r.created_at,
          unread: !readIds.has(id),
          href: "/reservations",
          state: { openId: r.id, date: r.reservation_date },
        });
      }
    }

    if (!reviewsRes.error) {
      for (const v of (reviewsRes.data ?? []) as Array<{
        id: string;
        author: string;
        rating: number;
        scale: number;
        text: string;
        created_at: string;
        replied: boolean;
      }>) {
        const stars = Math.round((v.rating / v.scale) * 5);
        const isNegative = stars <= 2;
        const id = `avis:${v.id}`;
        list.push({
          id,
          kind: "avis",
          text: `${v.author} a laissé un avis ${stars}★${isNegative ? " — réponse attendue" : ""}`,
          ago: relativeTime(v.created_at),
          createdAt: v.created_at,
          unread: !readIds.has(id),
          href: "/avis",
        });
      }
    }

    if (!ordersRes.error) {
      for (const o of (ordersRes.data ?? []) as Array<{
        id: string;
        display_id: string;
        table_label: string;
        status: string;
        created_at: string;
      }>) {
        const id = `cmd:${o.id}`;
        list.push({
          id,
          kind: "commande",
          text: `Nouvelle commande ${o.display_id}${o.table_label ? ` · table ${o.table_label}` : ""}`,
          ago: relativeTime(o.created_at),
          createdAt: o.created_at,
          unread: !readIds.has(id),
          href: "/commandes",
        });
      }
    }

    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (mounted.current) setItems(list);
  }, [restaurantId, readIds]);

  useEffect(() => {
    mounted.current = true;
    void load();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30_000);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
  }, [load]);

  const markRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        saveReadIds(next);
        return next;
      });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    },
    []
  );

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const item of items) next.add(item.id);
      saveReadIds(next);
      return next;
    });
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, [items]);

  const unreadCount = items.filter((n) => n.unread).length;

  return {
    items,
    unreadCount,
    markRead,
    markAllRead,
    refresh: load,
  };
}
