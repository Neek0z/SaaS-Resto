import { supabase } from "@/lib/supabase";

export type PublicMenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  photo_url: string | null;
  available: boolean;
  tags: string[];
  allergenes: string[];
  badge: string | null;
  position: number;
};

export type PublicMenuCategory = {
  id: string;
  name: string;
  position: number;
  items: PublicMenuItem[];
};

export type PublicMenuPayload = {
  restaurant: {
    id: string;
    name: string;
    logo_url: string | null;
    slug: string;
  };
  categories: PublicMenuCategory[];
};

export async function fetchPublicMenu(slug: string): Promise<PublicMenuPayload | null> {
  if (!supabase) throw new Error("Supabase non configuré.");
  const { data, error } = await supabase.rpc("get_public_menu", { p_slug: slug });
  if (error) throw error;
  if (!data) return null;
  const payload = data as PublicMenuPayload;
  // Defensive: numeric prices may come as strings depending on Postgres serialization.
  payload.categories = (payload.categories ?? []).map((c) => ({
    ...c,
    items: (c.items ?? []).map((i) => ({
      ...i,
      price: typeof i.price === "string" ? Number(i.price) : i.price,
    })),
  }));
  return payload;
}
