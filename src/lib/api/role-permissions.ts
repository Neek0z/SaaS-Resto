import { supabase } from "@/lib/supabase";
import type { PermissionOverrides } from "@/config/permissions";

function requireClient() {
  if (!supabase) throw new Error("Supabase non configuré.");
  return supabase;
}

export async function saveRolePermissions(
  restaurantId: string,
  overrides: PermissionOverrides
): Promise<void> {
  const sb = requireClient();
  const { error } = await sb
    .from("restaurants")
    .update({ role_permissions: overrides })
    .eq("id", restaurantId);
  if (error) throw error;
}
