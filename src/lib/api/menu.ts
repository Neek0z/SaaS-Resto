import { MENU_PERF, type MenuItem } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

// Expected Supabase table `menu_items`:
// id (uuid), name (text), category (text), sold (int),
// stock (text), margin (numeric), trend (numeric).

export async function listMenuItems(): Promise<MenuItem[]> {
  if (!supabase) return MENU_PERF;

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("sold", { ascending: false });

  if (error) {
    console.error("[menu] supabase error — falling back to mocks", error);
    return MENU_PERF;
  }

  return (data ?? []).map((r): MenuItem => ({
    name: r.name,
    cat: r.category,
    sold: r.sold,
    stock: r.stock,
    margin: Number(r.margin),
    trend: Number(r.trend),
  }));
}
