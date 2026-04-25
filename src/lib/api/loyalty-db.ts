import { supabase } from "@/lib/supabase";
import type {
  LoyaltyConfig,
  LoyaltyCustomer,
  LoyaltyReward,
  LoyaltyTier,
  LoyaltyTransaction,
  LoyaltyTransactionType,
} from "@/lib/loyalty-types";

type CustomerRow = {
  id: string;
  restaurant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  points: number;
  total_spent: number | string;
  visit_count: number;
  last_visit: string | null;
  tier: LoyaltyTier;
  created_at: string;
};

type RewardRow = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  points_cost: number;
  active: boolean;
  claimed_count: number;
  created_at: string;
};

type TransactionRow = {
  id: string;
  restaurant_id: string;
  customer_id: string;
  type: LoyaltyTransactionType;
  points: number;
  description: string | null;
  order_id: string | null;
  created_at: string;
};

type ConfigRow = {
  restaurant_id: string;
  active: boolean;
  program_name: string;
  welcome_message: string | null;
  points_per_euro: number | string;
  threshold_silver: number;
  threshold_gold: number;
};

function mapCustomer(r: CustomerRow): LoyaltyCustomer {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    points: r.points,
    totalSpent: typeof r.total_spent === "string" ? Number(r.total_spent) : r.total_spent,
    visitCount: r.visit_count,
    lastVisit: r.last_visit,
    tier: r.tier,
    createdAt: r.created_at,
  };
}

function mapReward(r: RewardRow): LoyaltyReward {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    name: r.name,
    description: r.description,
    pointsCost: r.points_cost,
    active: r.active,
    claimedCount: r.claimed_count,
    createdAt: r.created_at,
  };
}

function mapTransaction(r: TransactionRow): LoyaltyTransaction {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    customerId: r.customer_id,
    type: r.type,
    points: r.points,
    description: r.description,
    orderId: r.order_id,
    createdAt: r.created_at,
  };
}

function mapConfig(r: ConfigRow): LoyaltyConfig {
  return {
    restaurantId: r.restaurant_id,
    active: r.active,
    programName: r.program_name,
    welcomeMessage: r.welcome_message,
    pointsPerEuro:
      typeof r.points_per_euro === "string" ? Number(r.points_per_euro) : r.points_per_euro,
    thresholdSilver: r.threshold_silver,
    thresholdGold: r.threshold_gold,
  };
}

function requireClient() {
  if (!supabase) throw new Error("Supabase non configuré.");
  return supabase;
}

// =============================================================
// Customers
// =============================================================
export async function fetchCustomers(restaurantId: string): Promise<LoyaltyCustomer[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("loyalty_customers")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("points", { ascending: false });
  if (error) throw error;
  return (data as CustomerRow[]).map(mapCustomer);
}

export async function createCustomer(
  restaurantId: string,
  payload: {
    name: string;
    email: string | null;
    phone: string | null;
  }
): Promise<LoyaltyCustomer> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("loyalty_customers")
    .insert({
      restaurant_id: restaurantId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapCustomer(data as CustomerRow);
}

export async function updateCustomerTier(id: string, tier: LoyaltyTier): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("loyalty_customers").update({ tier }).eq("id", id);
  if (error) throw error;
}

export async function adjustCustomerPoints(
  id: string,
  newPoints: number,
  newTier: LoyaltyTier
): Promise<void> {
  const sb = requireClient();
  const { error } = await sb
    .from("loyalty_customers")
    .update({ points: newPoints, tier: newTier })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCustomer(id: string): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("loyalty_customers").delete().eq("id", id);
  if (error) throw error;
}

// =============================================================
// Rewards
// =============================================================
export async function fetchRewards(restaurantId: string): Promise<LoyaltyReward[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("loyalty_rewards")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("points_cost", { ascending: true });
  if (error) throw error;
  return (data as RewardRow[]).map(mapReward);
}

export async function createReward(
  restaurantId: string,
  payload: {
    name: string;
    description: string | null;
    pointsCost: number;
    active: boolean;
  }
): Promise<LoyaltyReward> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("loyalty_rewards")
    .insert({
      restaurant_id: restaurantId,
      name: payload.name,
      description: payload.description,
      points_cost: payload.pointsCost,
      active: payload.active,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapReward(data as RewardRow);
}

export async function updateReward(
  id: string,
  payload: {
    name: string;
    description: string | null;
    pointsCost: number;
    active: boolean;
  }
): Promise<void> {
  const sb = requireClient();
  const { error } = await sb
    .from("loyalty_rewards")
    .update({
      name: payload.name,
      description: payload.description,
      points_cost: payload.pointsCost,
      active: payload.active,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function toggleRewardActive(id: string, active: boolean): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("loyalty_rewards").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function incrementRewardClaimed(id: string): Promise<void> {
  const sb = requireClient();
  const { data: current, error: readErr } = await sb
    .from("loyalty_rewards")
    .select("claimed_count")
    .eq("id", id)
    .single();
  if (readErr) throw readErr;
  const currentCount = (current as { claimed_count: number } | null)?.claimed_count ?? 0;
  const { error } = await sb
    .from("loyalty_rewards")
    .update({ claimed_count: currentCount + 1 })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteReward(id: string): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("loyalty_rewards").delete().eq("id", id);
  if (error) throw error;
}

// =============================================================
// Transactions
// =============================================================
export async function fetchCustomerTransactions(
  customerId: string
): Promise<LoyaltyTransaction[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("loyalty_transactions")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as TransactionRow[]).map(mapTransaction);
}

export async function fetchRecentTransactions(
  restaurantId: string,
  sinceIso: string
): Promise<LoyaltyTransaction[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("loyalty_transactions")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", sinceIso);
  if (error) throw error;
  return (data as TransactionRow[]).map(mapTransaction);
}

export async function createTransaction(payload: {
  restaurantId: string;
  customerId: string;
  type: LoyaltyTransactionType;
  points: number;
  description: string | null;
  orderId?: string | null;
}): Promise<LoyaltyTransaction> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("loyalty_transactions")
    .insert({
      restaurant_id: payload.restaurantId,
      customer_id: payload.customerId,
      type: payload.type,
      points: payload.points,
      description: payload.description,
      order_id: payload.orderId ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapTransaction(data as TransactionRow);
}

// =============================================================
// Config
// =============================================================
export async function fetchConfig(restaurantId: string): Promise<LoyaltyConfig | null> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("loyalty_config")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapConfig(data as ConfigRow) : null;
}

export async function upsertConfig(config: LoyaltyConfig): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("loyalty_config").upsert({
    restaurant_id: config.restaurantId,
    active: config.active,
    program_name: config.programName,
    welcome_message: config.welcomeMessage,
    points_per_euro: config.pointsPerEuro,
    threshold_silver: config.thresholdSilver,
    threshold_gold: config.thresholdGold,
  });
  if (error) throw error;
}
