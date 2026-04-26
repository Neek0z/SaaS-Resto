import { supabase } from "@/lib/supabase";

export type PublicOrderLine = {
  item_id: string;
  quantity: number;
};

export type PublicOrderResult = {
  id: string;
  display_id: string;
  total: number;
  status: "pending";
};

export async function createPublicOrder(args: {
  slug: string;
  tableLabel: string;
  items: PublicOrderLine[];
  name: string;
  note: string;
}): Promise<PublicOrderResult> {
  if (!supabase) throw new Error("Supabase non configuré.");
  const { data, error } = await supabase.rpc("create_public_order", {
    p_slug: args.slug,
    p_table_label: args.tableLabel,
    p_items: args.items,
    p_name: args.name,
    p_note: args.note,
  });
  if (error) throw error;
  const result = data as PublicOrderResult;
  return {
    ...result,
    total: typeof result.total === "string" ? Number(result.total) : result.total,
  };
}
