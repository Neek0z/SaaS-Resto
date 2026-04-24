import { ORDERS, type Order } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

// Single point to swap mocks for Supabase once the `orders` table exists.
// Expected columns: id (text), table_label (text), covers (int), items (text[]),
// total (numeric), status (text), created_at (timestamptz), channel (text),
// waiter (text), priority (text), pickup_time (text nullable).

export async function listOrders(): Promise<Order[]> {
  if (!supabase) return ORDERS;

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[orders] supabase error — falling back to mocks", error);
    return ORDERS;
  }

  return (data ?? []).map((r): Order => ({
    id: r.id,
    table: r.table_label,
    covers: r.covers,
    items: r.items ?? [],
    total: Number(r.total),
    status: r.status,
    time: r.created_at,
    channel: r.channel,
    waiter: r.waiter ?? "—",
    priority: r.priority ?? "normal",
    pickup: r.pickup_time ?? undefined,
  }));
}
