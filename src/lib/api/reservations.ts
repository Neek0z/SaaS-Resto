import { supabase } from "@/lib/supabase";
import type {
  NewReservation,
  Reservation,
  ReservationPatch,
  ResaStatus,
} from "@/lib/reservation-types";

type Row = {
  id: string;
  restaurant_id: string;
  reservation_date: string;
  reservation_time: string;
  name: string;
  covers: number;
  table_label: string;
  status: ResaStatus;
  note: string | null;
  phone: string | null;
  email: string | null;
  duration_minutes: number;
  source: string;
  created_at: string;
  updated_at: string;
};

function mapRow(r: Row): Reservation {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    date: r.reservation_date,
    time: r.reservation_time,
    name: r.name,
    covers: r.covers,
    table: r.table_label,
    status: r.status,
    note: r.note ?? "",
    phone: r.phone ?? "",
    email: r.email ?? "",
    durationMinutes: r.duration_minutes,
    source: r.source,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function listReservations(date?: string): Promise<Reservation[]> {
  if (!supabase) throw new Error("Supabase non configuré.");
  const target = date ?? todayISO();
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("reservation_date", target)
    .order("reservation_time", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Row));
}

export async function createReservation(input: NewReservation): Promise<Reservation> {
  if (!supabase) throw new Error("Supabase non configuré.");
  const payload = {
    reservation_date: input.date ?? todayISO(),
    reservation_time: input.time,
    name: input.name,
    covers: input.covers,
    table_label: input.table,
    status: input.status ?? "confirmed",
    note: input.note ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    duration_minutes: input.durationMinutes ?? 90,
    source: input.source ?? "manual",
  };
  const { data, error } = await supabase
    .from("reservations")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function updateReservation(
  id: string,
  patch: ReservationPatch
): Promise<Reservation> {
  if (!supabase) throw new Error("Supabase non configuré.");
  const dbPatch: Record<string, unknown> = {};
  if (patch.date !== undefined) dbPatch.reservation_date = patch.date;
  if (patch.time !== undefined) dbPatch.reservation_time = patch.time;
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.covers !== undefined) dbPatch.covers = patch.covers;
  if (patch.table !== undefined) dbPatch.table_label = patch.table;
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.note !== undefined) dbPatch.note = patch.note;
  if (patch.phone !== undefined) dbPatch.phone = patch.phone;
  if (patch.email !== undefined) dbPatch.email = patch.email;
  if (patch.durationMinutes !== undefined) dbPatch.duration_minutes = patch.durationMinutes;
  if (patch.source !== undefined) dbPatch.source = patch.source;

  const { data, error } = await supabase
    .from("reservations")
    .update(dbPatch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function deleteReservation(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase non configuré.");
  const { error } = await supabase.from("reservations").delete().eq("id", id);
  if (error) throw error;
}
