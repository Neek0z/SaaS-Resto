import { useAuth } from "@/contexts/AuthContext";
import {
  DEV_OVERRIDE_PLAN,
  PLAN_FEATURES,
  planRank,
  type Feature,
  type Plan,
} from "@/config/plans";

type UsePlan = {
  plan: Plan;
  isPlanLoading: boolean;
  canAccess: (feature: Feature) => boolean;
  isAtLeast: (minPlan: Plan) => boolean;
};

export function usePlan(): UsePlan {
  const { restaurant, loading } = useAuth();

  const sessionPlan: Plan | null =
    typeof sessionStorage !== "undefined"
      ? ((sessionStorage.getItem("dev:plan") as Plan | null) ?? null)
      : null;

  const plan: Plan =
    DEV_OVERRIDE_PLAN !== false
      ? DEV_OVERRIDE_PLAN
      : sessionPlan ?? restaurant?.plan ?? "essentiel";

  const canAccess = (feature: Feature): boolean => PLAN_FEATURES[plan].includes(feature);
  const isAtLeast = (minPlan: Plan): boolean => planRank(plan) >= planRank(minPlan);

  return {
    plan,
    isPlanLoading: DEV_OVERRIDE_PLAN !== false ? false : loading,
    canAccess,
    isAtLeast,
  };
}
