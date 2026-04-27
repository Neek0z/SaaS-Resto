import { supabase } from "@/lib/supabase";

// Renvoyé par les RPC : on garde un typage souple (les colonnes
// arrivent en snake_case directement de Postgres).
export type MyLoyaltyAccountResponse = {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    points: number;
    total_spent: number | string;
    visit_count: number;
    last_visit: string | null;
    tier: "bronze" | "silver" | "gold" | "platine";
    created_at: string;
  } | null;
  transactions: {
    id: string;
    type: "earn" | "redeem";
    points: number;
    description: string | null;
    order_id: string | null;
    created_at: string;
  }[];
  rewards: {
    id: string;
    name: string;
    description: string | null;
    points_cost: number;
  }[];
  config: {
    program_name: string;
    welcome_message: string | null;
    points_per_euro: number | string;
    threshold_silver: number;
    threshold_gold: number;
  } | null;
};

function requireClient() {
  if (!supabase) throw new Error("Supabase non configuré.");
  return supabase;
}

/** À appeler après le retour OTP : lie le compte auth au dossier fidélité. */
export async function linkOrCreateMyLoyaltyAccount(
  slug: string,
  opts: { name?: string; phone?: string } = {}
): Promise<{ id: string; restaurant_id: string }> {
  const sb = requireClient();
  const { data, error } = await sb.rpc("link_or_create_my_loyalty_account", {
    p_slug: slug,
    p_name: opts.name ?? null,
    p_phone: opts.phone ?? null,
  });
  if (error) throw error;
  return data as { id: string; restaurant_id: string };
}

export async function fetchMyLoyaltyAccount(
  slug: string
): Promise<MyLoyaltyAccountResponse> {
  const sb = requireClient();
  const { data, error } = await sb.rpc("get_my_loyalty_account", { p_slug: slug });
  if (error) throw error;
  return data as MyLoyaltyAccountResponse;
}

export async function redeemMyLoyaltyReward(
  slug: string,
  rewardId: string
): Promise<{ transaction_id: string; new_points: number; new_tier: string }> {
  const sb = requireClient();
  const { data, error } = await sb.rpc("redeem_my_loyalty_reward", {
    p_slug: slug,
    p_reward_id: rewardId,
  });
  if (error) throw error;
  return data as { transaction_id: string; new_points: number; new_tier: string };
}

/** Envoie un magic link pour un compte client fidélité. */
export async function sendLoyaltyMagicLink(
  email: string,
  slug: string
): Promise<void> {
  const sb = requireClient();
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
    `/fidelite/${slug}/compte`
  )}`;
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
      data: { account_type: "loyalty" },
    },
  });
  if (error) throw error;
}
