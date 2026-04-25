import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createReservation,
  deleteReservation,
  listReservations,
  updateReservation,
} from "@/lib/api/reservations";
import type {
  NewReservation,
  Reservation,
  ReservationPatch,
} from "@/lib/reservation-types";
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
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Connexion réseau indisponible.";
  }
  return msg;
}

function sortByTime(a: Reservation, b: Reservation) {
  return a.time.localeCompare(b.time);
}

type UseReservations = {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  date: string;
  setDate: (date: string) => void;
  reload: () => Promise<void>;
  add: (input: NewReservation) => Promise<Reservation | null>;
  update: (id: string, patch: ReservationPatch) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export function useReservations(initialDate?: string): UseReservations {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;
  const [date, setDate] = useState<string>(initialDate ?? new Date().toISOString().slice(0, 10));
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (!restaurantId) {
      setReservations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await listReservations(date);
      if (!mounted.current) return;
      setReservations(rows);
    } catch (e) {
      if (mounted.current) setError(translateError(e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [restaurantId, date]);

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

  const add = useCallback(
    async (input: NewReservation): Promise<Reservation | null> => {
      try {
        const created = await createReservation({ ...input, date: input.date ?? date });
        if (created.date === date) {
          setReservations((prev) => [...prev, created].sort(sortByTime));
        }
        return created;
      } catch (e) {
        setError(translateError(e));
        return null;
      }
    },
    [date]
  );

  const update = useCallback(
    async (id: string, patch: ReservationPatch) => {
      const before = reservations;
      setReservations((prev) =>
        prev
          .map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...(patch.date !== undefined ? { date: patch.date } : {}),
                  ...(patch.time !== undefined ? { time: patch.time } : {}),
                  ...(patch.name !== undefined ? { name: patch.name } : {}),
                  ...(patch.covers !== undefined ? { covers: patch.covers } : {}),
                  ...(patch.table !== undefined ? { table: patch.table } : {}),
                  ...(patch.status !== undefined ? { status: patch.status } : {}),
                  ...(patch.note !== undefined ? { note: patch.note } : {}),
                  ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
                  ...(patch.email !== undefined ? { email: patch.email } : {}),
                  ...(patch.durationMinutes !== undefined
                    ? { durationMinutes: patch.durationMinutes }
                    : {}),
                  ...(patch.source !== undefined ? { source: patch.source } : {}),
                }
              : r
          )
          .sort(sortByTime)
      );
      try {
        await updateReservation(id, patch);
      } catch (e) {
        setReservations(before);
        setError(translateError(e));
      }
    },
    [reservations]
  );

  const remove = useCallback(
    async (id: string) => {
      const before = reservations;
      setReservations((prev) => prev.filter((r) => r.id !== id));
      try {
        await deleteReservation(id);
      } catch (e) {
        setReservations(before);
        setError(translateError(e));
      }
    },
    [reservations]
  );

  return {
    reservations,
    loading,
    error,
    date,
    setDate,
    reload: load,
    add,
    update,
    remove,
  };
}
