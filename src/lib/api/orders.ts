import { supabase } from "@/lib/supabase";
import type {
  NewOrder,
  Order,
  OrderPatch,
  OrderStatus,
  OrderChannel,
  OrderPriority,
} from "@/lib/order-types";

type Row = {
  id: string;
  restaurant_id: string;
  display_id: string;
  table_label: string;
  covers: number;
  items: string[];
  total: number | string;
  status: OrderStatus;
  channel: OrderChannel;
  waiter: string | null;
  priority: OrderPriority;
  pickup_time: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(r: Row): Order {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    displayId: r.display_id,
    table: r.table_label,
    covers: r.covers,
    items: r.items ?? [],
    total: typeof r.total === "string" ? Number(r.total) : r.total,
    status: r.status,
    channel: r.channel,
    waiter: r.waiter ?? "—",
    priority: r.priority,
    pickup: r.pickup_time ?? "",
    note: r.note ?? "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function genDisplayId(channel: OrderChannel, table: string): string {
  const stamp = Math.floor(Math.random() * 9000 + 1000);
  if (channel === "cc") return `CC-${stamp}`;
  if (channel === "delivery") return `LV-${stamp}`;
  const tn = table.match(/\d+/)?.[0] ?? `${stamp}`;
  return `T-${String(tn).padStart(2, "0")}`;
}

export async function listOrders(): Promise<Order[]> {
  if (!supabase) throw new Error("Supabase non configuré.");
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Row));
}

export async function createOrder(input: NewOrder): Promise<Order> {
  if (!supabase) throw new Error("Supabase non configuré.");
  const channel: OrderChannel = input.channel ?? "salle";
  const payload = {
    display_id: input.displayId ?? genDisplayId(channel, input.table),
    table_label: input.table,
    covers: input.covers,
    items: input.items,
    total: input.total,
    status: input.status ?? "pending",
    channel,
    waiter: input.waiter ?? null,
    priority: input.priority ?? "normal",
    pickup_time: input.pickup ?? null,
    note: input.note ?? null,
  };
  const { data, error } = await supabase
    .from("orders")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function updateOrder(id: string, patch: OrderPatch): Promise<Order> {
  if (!supabase) throw new Error("Supabase non configuré.");
  const dbPatch: Record<string, unknown> = {};
  if (patch.displayId !== undefined) dbPatch.display_id = patch.displayId;
  if (patch.table !== undefined) dbPatch.table_label = patch.table;
  if (patch.covers !== undefined) dbPatch.covers = patch.covers;
  if (patch.items !== undefined) dbPatch.items = patch.items;
  if (patch.total !== undefined) dbPatch.total = patch.total;
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.channel !== undefined) dbPatch.channel = patch.channel;
  if (patch.waiter !== undefined) dbPatch.waiter = patch.waiter;
  if (patch.priority !== undefined) dbPatch.priority = patch.priority;
  if (patch.pickup !== undefined) dbPatch.pickup_time = patch.pickup || null;
  if (patch.note !== undefined) dbPatch.note = patch.note;

  const { data, error } = await supabase
    .from("orders")
    .update(dbPatch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return updateOrder(id, { status });
}

export async function deleteOrder(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase non configuré.");
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
}
