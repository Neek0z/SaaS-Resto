import { supabase } from "@/lib/supabase";
import type { TableZone } from "@/lib/api/restaurant-tables";

export type PublicResaTable = {
  id: string;
  label: string;
  capacity: number;
  zone: TableZone;
};

export type PublicResaInfo = {
  restaurant: {
    id: string;
    name: string;
    logo_url: string | null;
    slug: string;
    hours: Record<string, unknown>;
  };
  tables: PublicResaTable[];
};

export type PublicReservationInput = {
  name: string;
  phone: string;
  email?: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  covers: number;
  tableLabel?: string;
  note?: string;
};

export type PublicReservationResult = {
  id: string;
  table_label: string;
  status: "pending";
};

export async function fetchPublicReservationInfo(
  slug: string
): Promise<PublicResaInfo | null> {
  if (!supabase) throw new Error("Supabase non configuré.");
  const { data, error } = await supabase.rpc("get_public_reservation_info", {
    p_slug: slug,
  });
  if (error) throw error;
  if (!data) return null;
  return data as PublicResaInfo;
}

export async function createPublicReservation(
  slug: string,
  input: PublicReservationInput
): Promise<PublicReservationResult> {
  if (!supabase) throw new Error("Supabase non configuré.");
  const { data, error } = await supabase.rpc("create_public_reservation", {
    p_slug: slug,
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email ?? "",
    p_date: input.date,
    p_time: input.time,
    p_covers: input.covers,
    p_table_label: input.tableLabel ?? "",
    p_note: input.note ?? "",
  });
  if (error) throw error;
  return data as PublicReservationResult;
}
