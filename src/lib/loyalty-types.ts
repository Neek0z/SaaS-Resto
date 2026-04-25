export type LoyaltyTier = "bronze" | "silver" | "gold";

export type LoyaltyCustomer = {
  id: string;
  restaurantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  points: number;
  totalSpent: number;
  visitCount: number;
  lastVisit: string | null;
  tier: LoyaltyTier;
  createdAt: string;
};

export type LoyaltyReward = {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  pointsCost: number;
  active: boolean;
  claimedCount: number;
  createdAt: string;
};

export type LoyaltyTransactionType = "earn" | "redeem";

export type LoyaltyTransaction = {
  id: string;
  restaurantId: string;
  customerId: string;
  type: LoyaltyTransactionType;
  points: number;
  description: string | null;
  orderId: string | null;
  createdAt: string;
};

export type LoyaltyConfig = {
  restaurantId: string;
  active: boolean;
  programName: string;
  welcomeMessage: string | null;
  pointsPerEuro: number;
  thresholdSilver: number;
  thresholdGold: number;
};

export const TIER_LABEL: Record<LoyaltyTier, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
};

export const TIER_COLOR: Record<LoyaltyTier, string> = {
  bronze: "#8a6a41",
  silver: "#b8b3a8",
  gold: "#d29528",
};

export function computeTier(points: number, config: LoyaltyConfig): LoyaltyTier {
  if (points >= config.thresholdGold) return "gold";
  if (points >= config.thresholdSilver) return "silver";
  return "bronze";
}

export function nextTier(
  tier: LoyaltyTier,
  config: LoyaltyConfig
): { next: LoyaltyTier | null; at: number } {
  if (tier === "bronze") return { next: "silver", at: config.thresholdSilver };
  if (tier === "silver") return { next: "gold", at: config.thresholdGold };
  return { next: null, at: 0 };
}
