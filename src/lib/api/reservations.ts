import { RESERVATIONS, type Reservation } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

// Expected Supabase table `reservations`:
// id (uuid), time (time), name (text), covers (int),
// table_label (text), status (text), note (text nullable), date (date).

export async function listReservations(date?: string): Promise<Reservation[]> {
  if (!supabase) return RESERVATIONS;

  let query = supabase.from("reservations").select("*").order("time", { ascending: true });
  if (date) query = query.eq("date", date);

  const { data, error } = await query;
  if (error) {
    console.error("[reservations] supabase error — falling back to mocks", error);
    return RESERVATIONS;
  }

  return (data ?? []).map((r): Reservation => ({
    time: r.time,
    name: r.name,
    covers: r.covers,
    table: r.table_label,
    status: r.status,
    note: r.note ?? "",
  }));
}
