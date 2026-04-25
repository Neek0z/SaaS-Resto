import { supabase } from "@/lib/supabase";
import type {
  EventAppliesTo,
  EventDiscountType,
  EventPayload,
  EventType,
  RestaurantEvent,
} from "@/lib/event-types";

type EventRow = {
  id: string;
  restaurant_id: string;
  title: string;
  description: string | null;
  type: EventType;
  discount_type: EventDiscountType | null;
  discount_value: number | string | null;
  loyalty_bonus: number | string | null;
  applies_to: EventAppliesTo;
  applies_to_id: string | null;
  days_of_week: number[] | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  display_on_carte: boolean;
  color: string;
  active: boolean;
  created_at: string;
};

function toNum(v: number | string | null): number | null {
  if (v === null || v === undefined) return null;
  return typeof v === "string" ? Number(v) : v;
}

function trimSeconds(t: string | null): string | null {
  if (!t) return null;
  // Postgres renvoie "HH:MM:SS" — on garde "HH:MM"
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function mapEvent(r: EventRow): RestaurantEvent {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    title: r.title,
    description: r.description,
    type: r.type,
    discountType: r.discount_type,
    discountValue: toNum(r.discount_value),
    loyaltyBonus: toNum(r.loyalty_bonus),
    appliesTo: r.applies_to,
    appliesToId: r.applies_to_id,
    daysOfWeek: r.days_of_week ?? [],
    startDate: r.start_date,
    endDate: r.end_date,
    startTime: trimSeconds(r.start_time),
    endTime: trimSeconds(r.end_time),
    displayOnCarte: r.display_on_carte,
    color: r.color,
    active: r.active,
    createdAt: r.created_at,
  };
}

function payloadToRow(payload: EventPayload) {
  return {
    title: payload.title,
    description: payload.description,
    type: payload.type,
    discount_type: payload.discountType,
    discount_value: payload.discountValue,
    loyalty_bonus: payload.loyaltyBonus,
    applies_to: payload.appliesTo,
    applies_to_id: payload.appliesToId,
    days_of_week: payload.daysOfWeek,
    start_date: payload.startDate,
    end_date: payload.endDate,
    start_time: payload.startTime,
    end_time: payload.endTime,
    display_on_carte: payload.displayOnCarte,
    color: payload.color,
    active: payload.active,
  };
}

function requireClient() {
  if (!supabase) throw new Error("Supabase non configuré.");
  return supabase;
}

export async function fetchEvents(restaurantId: string): Promise<RestaurantEvent[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("events")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as EventRow[]).map(mapEvent);
}

export async function createEvent(
  restaurantId: string,
  payload: EventPayload
): Promise<RestaurantEvent> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("events")
    .insert({ restaurant_id: restaurantId, ...payloadToRow(payload) })
    .select("*")
    .single();
  if (error) throw error;
  return mapEvent(data as EventRow);
}

export async function updateEvent(
  id: string,
  payload: EventPayload
): Promise<void> {
  const sb = requireClient();
  const { error } = await sb
    .from("events")
    .update(payloadToRow(payload))
    .eq("id", id);
  if (error) throw error;
}

export async function toggleEventActive(id: string, active: boolean): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("events").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(id: string): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("events").delete().eq("id", id);
  if (error) throw error;
}
