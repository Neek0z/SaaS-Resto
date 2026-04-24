import { supabase } from "@/lib/supabase";
import { LOYALTY, type LoyaltyCustomer, type LoyaltyReward } from "@/lib/mock-data";

// Supabase schema (expected):
// create table loyalty_customers (
//   id uuid primary key default gen_random_uuid(),
//   name text not null,
//   avatar text,
//   email text,
//   tier text not null check (tier in ('bronze','silver','gold','platine')),
//   points int not null default 0,
//   visits int not null default 0,
//   spent numeric not null default 0,
//   last_visit text,
//   favorite text
// );
// create table loyalty_rewards (
//   id uuid primary key default gen_random_uuid(),
//   name text not null,
//   cost int not null,
//   description text,
//   claimed int not null default 0,
//   active boolean not null default true
// );

export async function listCustomers(): Promise<LoyaltyCustomer[]> {
  if (!supabase) return LOYALTY.customers;
  const { data, error } = await supabase.from("loyalty_customers").select("*");
  if (error || !data) return LOYALTY.customers;
  return data.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    avatar: r.avatar as string,
    email: r.email as string,
    tier: r.tier as LoyaltyCustomer["tier"],
    points: r.points as number,
    visits: r.visits as number,
    spent: r.spent as number,
    lastVisit: r.last_visit as string,
    favorite: r.favorite as string,
  }));
}

export async function listRewards(): Promise<LoyaltyReward[]> {
  if (!supabase) return LOYALTY.rewards;
  const { data, error } = await supabase.from("loyalty_rewards").select("*");
  if (error || !data) return LOYALTY.rewards;
  return data as LoyaltyReward[];
}

export function getLoyaltyOverview() {
  return {
    members: LOYALTY.members,
    membersDelta: LOYALTY.membersDelta,
    active30d: LOYALTY.active30d,
    redeemed30d: LOYALTY.redeemed30d,
    avgVisits: LOYALTY.avgVisits,
    retention: LOYALTY.retention,
    tiers: LOYALTY.tiers,
  };
}
