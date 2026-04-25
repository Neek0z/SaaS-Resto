import { supabase } from "@/lib/supabase";

export type TableZone = "inside" | "terrace" | "bar" | "private";

export type RestaurantTable = {
  id: string;
  restaurantId: string;
  label: string;
  capacity: number;
  zone: TableZone;
  displayOrder: number;
  active: boolean;
};

type Row = {
  id: string;
  restaurant_id: string;
  label: string;
  capacity: number;
  zone: TableZone;
  display_order: number;
  active: boolean;
};

function mapRow(r: Row): RestaurantTable {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    label: r.label,
    capacity: r.capacity,
    zone: r.zone,
    displayOrder: r.display_order,
    active: r.active,
  };
}

function requireClient() {
  if (!supabase) throw new Error("Supabase non configuré.");
  return supabase;
}

export async function listTables(restaurantId: string): Promise<RestaurantTable[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("restaurant_tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("display_order", { ascending: true })
    .order("label", { ascending: true });
  if (error) throw error;
  return (data as Row[]).map(mapRow);
}

export async function listPublicTables(restaurantId: string): Promise<RestaurantTable[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("restaurant_tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data as Row[]).map(mapRow);
}

export async function createTable(input: {
  label: string;
  capacity: number;
  zone?: TableZone;
}): Promise<RestaurantTable> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("restaurant_tables")
    .insert({
      label: input.label,
      capacity: input.capacity,
      zone: input.zone ?? "inside",
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function updateTable(
  id: string,
  patch: Partial<Pick<RestaurantTable, "label" | "capacity" | "zone" | "active" | "displayOrder">>
): Promise<void> {
  const sb = requireClient();
  const row: Record<string, unknown> = {};
  if (patch.label !== undefined) row.label = patch.label;
  if (patch.capacity !== undefined) row.capacity = patch.capacity;
  if (patch.zone !== undefined) row.zone = patch.zone;
  if (patch.active !== undefined) row.active = patch.active;
  if (patch.displayOrder !== undefined) row.display_order = patch.displayOrder;
  const { error } = await sb.from("restaurant_tables").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteTable(id: string): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("restaurant_tables").delete().eq("id", id);
  if (error) throw error;
}
