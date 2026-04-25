import { supabase } from "@/lib/supabase";
import type { Role } from "@/config/roles";

export type AppUser = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
};

function requireClient() {
  if (!supabase) throw new Error("Supabase non configuré.");
  return supabase;
}

export async function fetchAppUsers(): Promise<AppUser[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("app_users")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    email: row.email as string,
    role: row.role as Role,
    createdAt: row.created_at as string,
  }));
}

export async function updateAppUserRole(id: string, role: Role): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("app_users").update({ role }).eq("id", id);
  if (error) throw error;
}

export async function revokeAppUser(id: string): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("app_users").delete().eq("id", id);
  if (error) throw error;
}

export type InviteResult = {
  ok: boolean;
  message: string;
};

export async function inviteAppUser(email: string, role: Role): Promise<InviteResult> {
  const sb = requireClient();
  try {
    const { data, error } = await sb.functions.invoke("invite-user", {
      body: { email, role },
    });
    if (error) {
      return {
        ok: false,
        message:
          (error.message ?? "") ||
          "Edge function 'invite-user' indisponible. Déployez-la pour envoyer l'invitation par email.",
      };
    }
    const ok = (data as { ok?: boolean } | null)?.ok ?? true;
    const message =
      (data as { message?: string } | null)?.message ?? "Invitation envoyée.";
    return { ok, message };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Erreur inconnue.",
    };
  }
}
