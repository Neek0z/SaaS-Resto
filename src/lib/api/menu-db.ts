import { supabase } from "@/lib/supabase";
import type { MenuBadge, MenuCategory, MenuItem } from "@/lib/menu-types";

type CatRow = {
  id: string;
  restaurant_id: string;
  name: string;
  position: number;
  active: boolean;
};

type ItemRow = {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number | string;
  photo_url: string | null;
  available: boolean;
  tags: string[] | null;
  allergenes: string[] | null;
  badge: string | null;
  tva_rate: number | string;
  position: number;
};

function mapCategory(r: CatRow): MenuCategory {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    name: r.name,
    position: r.position,
    active: r.active,
  };
}

function mapItem(r: ItemRow): MenuItem {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    categoryId: r.category_id,
    name: r.name,
    description: r.description,
    price: typeof r.price === "string" ? Number(r.price) : r.price,
    photoUrl: r.photo_url,
    available: r.available,
    tags: r.tags ?? [],
    allergenes: r.allergenes ?? [],
    badge: (r.badge as MenuBadge | null) ?? null,
    tvaRate: typeof r.tva_rate === "string" ? Number(r.tva_rate) : r.tva_rate,
    position: r.position,
  };
}

function requireClient() {
  if (!supabase) throw new Error("Supabase non configuré.");
  return supabase;
}

export async function fetchMenu(restaurantId: string): Promise<{
  categories: MenuCategory[];
  items: MenuItem[];
}> {
  const sb = requireClient();
  const [catRes, itemRes] = await Promise.all([
    sb.from("digital_menu_categories").select("*").eq("restaurant_id", restaurantId).order("position"),
    sb.from("digital_menu_items").select("*").eq("restaurant_id", restaurantId).order("position"),
  ]);
  if (catRes.error) throw catRes.error;
  if (itemRes.error) throw itemRes.error;
  return {
    categories: (catRes.data as CatRow[]).map(mapCategory),
    items: (itemRes.data as ItemRow[]).map(mapItem),
  };
}

export async function createCategory(
  restaurantId: string,
  name: string,
  position: number
): Promise<MenuCategory> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("digital_menu_categories")
    .insert({ restaurant_id: restaurantId, name, position, active: true })
    .select()
    .single();
  if (error) throw error;
  return mapCategory(data as CatRow);
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<MenuCategory, "name" | "active" | "position">>
): Promise<void> {
  const sb = requireClient();
  const { error } = await sb
    .from("digital_menu_categories")
    .update({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.active !== undefined ? { active: patch.active } : {}),
      ...(patch.position !== undefined ? { position: patch.position } : {}),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("digital_menu_categories").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderCategories(ordered: string[]): Promise<void> {
  const sb = requireClient();
  await Promise.all(
    ordered.map((id, index) =>
      sb.from("digital_menu_categories").update({ position: index }).eq("id", id)
    )
  );
}

export type NewItem = Omit<MenuItem, "id" | "restaurantId" | "position"> & {
  position?: number;
};

export async function createItem(
  restaurantId: string,
  payload: NewItem
): Promise<MenuItem> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("digital_menu_items")
    .insert({
      restaurant_id: restaurantId,
      category_id: payload.categoryId,
      name: payload.name,
      description: payload.description,
      price: payload.price,
      photo_url: payload.photoUrl,
      available: payload.available,
      tags: payload.tags,
      allergenes: payload.allergenes,
      badge: payload.badge,
      tva_rate: payload.tvaRate,
      position: payload.position ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return mapItem(data as ItemRow);
}

export async function updateItem(
  id: string,
  patch: Partial<Omit<MenuItem, "id" | "restaurantId">>
): Promise<void> {
  const sb = requireClient();
  const row: Record<string, unknown> = {};
  if (patch.categoryId !== undefined) row.category_id = patch.categoryId;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.price !== undefined) row.price = patch.price;
  if (patch.photoUrl !== undefined) row.photo_url = patch.photoUrl;
  if (patch.available !== undefined) row.available = patch.available;
  if (patch.tags !== undefined) row.tags = patch.tags;
  if (patch.allergenes !== undefined) row.allergenes = patch.allergenes;
  if (patch.badge !== undefined) row.badge = patch.badge;
  if (patch.tvaRate !== undefined) row.tva_rate = patch.tvaRate;
  if (patch.position !== undefined) row.position = patch.position;

  const { error } = await sb.from("digital_menu_items").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteItem(id: string): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("digital_menu_items").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderItems(ordered: string[]): Promise<void> {
  const sb = requireClient();
  await Promise.all(
    ordered.map((id, index) =>
      sb.from("digital_menu_items").update({ position: index }).eq("id", id)
    )
  );
}

// Storage -------------------------------------------------------

const BUCKET = "menu-photos";

export async function uploadItemPhoto(
  restaurantId: string,
  itemId: string,
  blob: Blob,
  extension: string
): Promise<string> {
  const sb = requireClient();
  const path = `${restaurantId}/${itemId}_${Date.now()}.${extension}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type,
    upsert: false,
    cacheControl: "3600",
  });
  if (error) throw error;
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteItemPhoto(publicUrl: string): Promise<void> {
  const sb = requireClient();
  const marker = `/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);
  const { error } = await sb.storage.from(BUCKET).remove([path]);
  if (error) {
    // fichier peut-être déjà absent, on n'interrompt pas
    // eslint-disable-next-line no-console
    if (import.meta.env.DEV) console.warn("[menu] suppression photo échouée:", error.message);
  }
}
