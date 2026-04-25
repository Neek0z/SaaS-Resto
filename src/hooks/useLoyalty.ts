import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  adjustCustomerPoints,
  createCustomer,
  createReward,
  createTransaction,
  deleteCustomer,
  deleteReward,
  fetchConfig,
  fetchCustomers,
  fetchRecentTransactions,
  fetchRewards,
  incrementRewardClaimed,
  toggleRewardActive,
  updateReward,
  upsertConfig,
} from "@/lib/api/loyalty-db";
import {
  computeTier,
  type LoyaltyConfig,
  type LoyaltyCustomer,
  type LoyaltyReward,
  type LoyaltyTransaction,
} from "@/lib/loyalty-types";

const DEFAULT_CONFIG: Omit<LoyaltyConfig, "restaurantId"> = {
  active: true,
  programName: "Programme fidélité",
  welcomeMessage: "Bienvenue dans notre programme fidélité !",
  pointsPerEuro: 10,
  thresholdSilver: 500,
  thresholdGold: 1500,
};

export type LoyaltyKpis = {
  total: number;
  activeMonth: number;
  pointsThisMonth: number;
  retention: number;
};

export function useLoyalty() {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;

  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [config, setConfig] = useState<LoyaltyConfig | null>(null);
  const [recentTx, setRecentTx] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!restaurantId) {
      setCustomers([]);
      setRewards([]);
      setConfig(null);
      setRecentTx([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const since = new Date();
      since.setDate(1);
      since.setHours(0, 0, 0, 0);
      const [c, r, cfg, tx] = await Promise.all([
        fetchCustomers(restaurantId),
        fetchRewards(restaurantId),
        fetchConfig(restaurantId),
        fetchRecentTransactions(restaurantId, since.toISOString()),
      ]);
      setCustomers(c);
      setRewards(r);
      setConfig(cfg ?? { restaurantId, ...DEFAULT_CONFIG });
      setRecentTx(tx);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec du chargement.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const effectiveConfig: LoyaltyConfig = useMemo(
    () => config ?? { restaurantId: restaurantId ?? "", ...DEFAULT_CONFIG },
    [config, restaurantId]
  );

  // -------------------------------------------------------------
  // Customers
  // -------------------------------------------------------------
  const addCustomer = useCallback(
    async (payload: { name: string; email: string | null; phone: string | null }) => {
      if (!restaurantId) return null;
      try {
        const created = await createCustomer(restaurantId, payload);
        setCustomers((prev) => [created, ...prev]);
        return created;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de la création du client.");
        return null;
      }
    },
    [restaurantId]
  );

  const removeCustomer = useCallback(
    async (id: string) => {
      const before = customers;
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      try {
        await deleteCustomer(id);
      } catch (e) {
        setCustomers(before);
        setError(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    },
    [customers]
  );

  const addPointsManually = useCallback(
    async (customerId: string, points: number, reason: string) => {
      if (!restaurantId) return;
      const target = customers.find((c) => c.id === customerId);
      if (!target) return;
      const before = customers;
      const beforeTx = recentTx;
      const newPoints = Math.max(0, target.points + points);
      const newTier = computeTier(newPoints, effectiveConfig);
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId ? { ...c, points: newPoints, tier: newTier } : c
        )
      );
      try {
        await adjustCustomerPoints(customerId, newPoints, newTier);
        const tx = await createTransaction({
          restaurantId,
          customerId,
          type: points >= 0 ? "earn" : "redeem",
          points,
          description: reason,
        });
        setRecentTx((prev) => [tx, ...prev]);
      } catch (e) {
        setCustomers(before);
        setRecentTx(beforeTx);
        setError(e instanceof Error ? e.message : "Échec de l'ajout de points.");
      }
    },
    [customers, recentTx, restaurantId, effectiveConfig]
  );

  const redeemReward = useCallback(
    async (customerId: string, rewardId: string) => {
      if (!restaurantId) return;
      const customer = customers.find((c) => c.id === customerId);
      const reward = rewards.find((r) => r.id === rewardId);
      if (!customer || !reward) return;
      if (customer.points < reward.pointsCost) {
        setError("Points insuffisants pour cette récompense.");
        return;
      }
      const beforeC = customers;
      const beforeR = rewards;
      const beforeTx = recentTx;
      const newPoints = customer.points - reward.pointsCost;
      const newTier = computeTier(newPoints, effectiveConfig);
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId ? { ...c, points: newPoints, tier: newTier } : c
        )
      );
      setRewards((prev) =>
        prev.map((r) =>
          r.id === rewardId ? { ...r, claimedCount: r.claimedCount + 1 } : r
        )
      );
      try {
        await adjustCustomerPoints(customerId, newPoints, newTier);
        await incrementRewardClaimed(rewardId);
        const tx = await createTransaction({
          restaurantId,
          customerId,
          type: "redeem",
          points: -reward.pointsCost,
          description: `Récompense : ${reward.name}`,
        });
        setRecentTx((prev) => [tx, ...prev]);
      } catch (e) {
        setCustomers(beforeC);
        setRewards(beforeR);
        setRecentTx(beforeTx);
        setError(e instanceof Error ? e.message : "Échec de l'échange.");
      }
    },
    [customers, rewards, recentTx, restaurantId, effectiveConfig]
  );

  // -------------------------------------------------------------
  // Rewards
  // -------------------------------------------------------------
  const addReward = useCallback(
    async (payload: {
      name: string;
      description: string | null;
      pointsCost: number;
      active: boolean;
    }) => {
      if (!restaurantId) return null;
      try {
        const created = await createReward(restaurantId, payload);
        setRewards((prev) => [...prev, created].sort((a, b) => a.pointsCost - b.pointsCost));
        return created;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de la création.");
        return null;
      }
    },
    [restaurantId]
  );

  const editReward = useCallback(
    async (
      id: string,
      payload: {
        name: string;
        description: string | null;
        pointsCost: number;
        active: boolean;
      }
    ) => {
      const before = rewards;
      setRewards((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                name: payload.name,
                description: payload.description,
                pointsCost: payload.pointsCost,
                active: payload.active,
              }
            : r
        )
      );
      try {
        await updateReward(id, payload);
      } catch (e) {
        setRewards(before);
        setError(e instanceof Error ? e.message : "Échec de la mise à jour.");
      }
    },
    [rewards]
  );

  const toggleReward = useCallback(
    async (id: string) => {
      const target = rewards.find((r) => r.id === id);
      if (!target) return;
      const next = !target.active;
      const before = rewards;
      setRewards((prev) =>
        prev.map((r) => (r.id === id ? { ...r, active: next } : r))
      );
      try {
        await toggleRewardActive(id, next);
      } catch (e) {
        setRewards(before);
        setError(e instanceof Error ? e.message : "Échec du changement.");
      }
    },
    [rewards]
  );

  const removeReward = useCallback(
    async (id: string) => {
      const before = rewards;
      setRewards((prev) => prev.filter((r) => r.id !== id));
      try {
        await deleteReward(id);
      } catch (e) {
        setRewards(before);
        setError(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    },
    [rewards]
  );

  // -------------------------------------------------------------
  // Config
  // -------------------------------------------------------------
  const saveConfig = useCallback(
    async (next: LoyaltyConfig) => {
      const before = config;
      setConfig(next);
      try {
        await upsertConfig(next);
      } catch (e) {
        setConfig(before);
        setError(e instanceof Error ? e.message : "Échec de la sauvegarde.");
      }
    },
    [config]
  );

  // -------------------------------------------------------------
  // KPIs
  // -------------------------------------------------------------
  const kpis: LoyaltyKpis = useMemo(() => {
    const total = customers.length;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const activeMonth = customers.filter((c) => {
      if (!c.lastVisit) return false;
      return new Date(c.lastVisit) >= monthStart;
    }).length;

    const pointsThisMonth = recentTx
      .filter((t) => t.type === "earn")
      .reduce((s, t) => s + Math.max(0, t.points), 0);

    const totalEverActive = customers.filter((c) => c.visitCount >= 2).length;
    const retention = total === 0 ? 0 : Math.round((totalEverActive / total) * 100);

    return { total, activeMonth, pointsThisMonth, retention };
  }, [customers, recentTx]);

  return {
    customers,
    rewards,
    config: effectiveConfig,
    recentTx,
    loading,
    error,
    kpis,
    reload,
    addCustomer,
    removeCustomer,
    addPointsManually,
    redeemReward,
    addReward,
    editReward,
    toggleReward,
    removeReward,
    saveConfig,
    clearError: () => setError(null),
  };
}
