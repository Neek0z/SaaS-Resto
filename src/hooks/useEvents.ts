import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  toggleEventActive,
  updateEvent,
} from "@/lib/api/events-db";
import {
  isActiveNow,
  type EventPayload,
  type RestaurantEvent,
} from "@/lib/event-types";
import { extractErrorMessage } from "@/lib/errors";

export function useEvents() {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;

  const [events, setEvents] = useState<RestaurantEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!restaurantId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchEvents(restaurantId);
      setEvents(list);
    } catch (e) {
      setError(extractErrorMessage(e) || "Échec du chargement.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addEvent = useCallback(
    async (payload: EventPayload): Promise<RestaurantEvent | null> => {
      if (!restaurantId) return null;
      try {
        const created = await createEvent(restaurantId, payload);
        setEvents((prev) => [created, ...prev]);
        return created;
      } catch (e) {
        setError(extractErrorMessage(e) || "Échec de la création.");
        return null;
      }
    },
    [restaurantId]
  );

  const editEvent = useCallback(
    async (id: string, payload: EventPayload): Promise<void> => {
      const before = events;
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === id
            ? {
                ...ev,
                ...payload,
              }
            : ev
        )
      );
      try {
        await updateEvent(id, payload);
      } catch (e) {
        setEvents(before);
        setError(extractErrorMessage(e) || "Échec de la mise à jour.");
      }
    },
    [events]
  );

  const toggleEvent = useCallback(
    async (id: string): Promise<void> => {
      const target = events.find((e) => e.id === id);
      if (!target) return;
      const next = !target.active;
      const before = events;
      setEvents((prev) =>
        prev.map((ev) => (ev.id === id ? { ...ev, active: next } : ev))
      );
      try {
        await toggleEventActive(id, next);
      } catch (e) {
        setEvents(before);
        setError(extractErrorMessage(e) || "Échec du changement.");
      }
    },
    [events]
  );

  const removeEvent = useCallback(
    async (id: string): Promise<void> => {
      const before = events;
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
      try {
        await deleteEvent(id);
      } catch (e) {
        setEvents(before);
        setError(extractErrorMessage(e) || "Échec de la suppression.");
      }
    },
    [events]
  );

  const duplicateEvent = useCallback(
    async (id: string): Promise<RestaurantEvent | null> => {
      const src = events.find((e) => e.id === id);
      if (!src) return null;
      const payload: EventPayload = {
        title: `${src.title} (copie)`,
        description: src.description,
        type: src.type,
        discountType: src.discountType,
        discountValue: src.discountValue,
        loyaltyBonus: src.loyaltyBonus,
        appliesTo: src.appliesTo,
        appliesToId: src.appliesToId,
        daysOfWeek: src.daysOfWeek,
        startDate: null,
        endDate: null,
        startTime: src.startTime,
        endTime: src.endTime,
        displayOnCarte: src.displayOnCarte,
        color: src.color,
        active: false,
      };
      return addEvent(payload);
    },
    [events, addEvent]
  );

  return {
    events,
    loading,
    error,
    reload,
    addEvent,
    editEvent,
    toggleEvent,
    removeEvent,
    duplicateEvent,
    clearError: () => setError(null),
  };
}

// =============================================================
// useActiveEvents : événements actifs maintenant
// (utilisé dans le dashboard et la carte digitale)
// =============================================================
export function useActiveEvents() {
  const { events, loading, error } = useEvents();
  const activeNow = useMemo(() => events.filter((e) => isActiveNow(e)), [events]);
  return { activeEvents: activeNow, allEvents: events, loading, error };
}
