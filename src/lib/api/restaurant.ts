import { supabase } from "@/lib/supabase";

function requireClient() {
  if (!supabase) throw new Error("Supabase non configuré.");
  return supabase;
}

export type RestaurantPatch = {
  name?: string;
  slug?: string;
  logoUrl?: string | null;
};

export async function updateRestaurant(id: string, patch: RestaurantPatch): Promise<void> {
  const sb = requireClient();
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.logoUrl !== undefined) row.logo_url = patch.logoUrl;
  if (Object.keys(row).length === 0) return;
  const { error } = await sb.from("restaurants").update(row).eq("id", id);
  if (error) throw error;
}

const LOGO_BUCKET = "restaurant-assets";

export async function uploadLogo(restaurantId: string, blob: Blob, extension: string): Promise<string> {
  const sb = requireClient();
  const path = `${restaurantId}/logo_${Date.now()}.${extension}`;
  const { error } = await sb.storage.from(LOGO_BUCKET).upload(path, blob, {
    contentType: blob.type,
    upsert: false,
    cacheControl: "3600",
  });
  if (error) throw error;
  const { data } = sb.storage.from(LOGO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteLogo(publicUrl: string): Promise<void> {
  const sb = requireClient();
  const marker = `/${LOGO_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);
  const { error } = await sb.storage.from(LOGO_BUCKET).remove([path]);
  if (error && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn("[restaurant] deleteLogo failed:", error.message);
  }
}

export function slugifyClient(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
