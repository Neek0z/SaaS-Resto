import { supabase } from "@/lib/supabase";

export type TopDish = {
  name: string;
  category: string | null;
  sold: number;
  trend: number;
};

type OrderRow = { items: string[] | null; created_at: string; status: string };
type MenuItemRow = { name: string; category_id: string };
type CategoryRow = { id: string; name: string };

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function shiftDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function countItems(orders: OrderRow[], start: Date, endExclusive: Date): Map<string, number> {
  const map = new Map<string, number>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const t = new Date(o.created_at).getTime();
    if (t < start.getTime() || t >= endExclusive.getTime()) continue;
    for (const raw of o.items ?? []) {
      const name = raw?.trim();
      if (!name) continue;
      map.set(name, (map.get(name) ?? 0) + 1);
    }
  }
  return map;
}

export async function fetchTopDishes(limit = 5): Promise<TopDish[]> {
  if (!supabase) throw new Error("Supabase non configuré.");

  const today = startOfDay(new Date());
  const start7 = shiftDays(today, -6);
  const startPrev7 = shiftDays(today, -13);

  const [ordersRes, itemsRes, catsRes] = await Promise.all([
    supabase
      .from("orders")
      .select("items, created_at, status")
      .gte("created_at", startPrev7.toISOString()),
    supabase.from("digital_menu_items").select("name, category_id"),
    supabase.from("digital_menu_categories").select("id, name"),
  ]);

  if (ordersRes.error) throw ordersRes.error;
  if (itemsRes.error) throw itemsRes.error;
  if (catsRes.error) throw catsRes.error;

  const orders = (ordersRes.data ?? []) as OrderRow[];
  const items = (itemsRes.data ?? []) as MenuItemRow[];
  const cats = (catsRes.data ?? []) as CategoryRow[];

  const catById = new Map(cats.map((c) => [c.id, c.name]));
  const catByItem = new Map(items.map((i) => [i.name, catById.get(i.category_id) ?? null]));

  const tomorrow = shiftDays(today, 1);
  const current = countItems(orders, start7, tomorrow);
  const previous = countItems(orders, startPrev7, start7);

  const top: TopDish[] = Array.from(current.entries())
    .map(([name, sold]) => {
      const prev = previous.get(name) ?? 0;
      const trend =
        prev === 0
          ? sold === 0
            ? 0
            : 100
          : Math.round(((sold - prev) / prev) * 100);
      return { name, sold, trend, category: catByItem.get(name) ?? null };
    })
    .sort((a, b) => b.sold - a.sold)
    .slice(0, limit);

  return top;
}
