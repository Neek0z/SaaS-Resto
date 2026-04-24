import type { ReactNode } from "react";
import { usePlan } from "@/hooks/usePlan";
import { featureMinPlan, type Feature, type Plan } from "@/config/plans";
import { UpgradeCard } from "./UpgradeCard";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
} & (
  | { feature: Feature; requiredPlan?: Plan }
  | { feature?: undefined; requiredPlan: Plan }
);

export function PlanGate(props: Props) {
  const { canAccess, isAtLeast } = usePlan();
  const { children, fallback, feature, requiredPlan } = props;

  const ok = feature ? canAccess(feature) : isAtLeast(requiredPlan as Plan);
  if (ok) return <>{children}</>;

  if (fallback !== undefined) return <>{fallback}</>;

  const plan: Plan = requiredPlan ?? (feature ? featureMinPlan(feature) : "pro");
  return <UpgradeCard feature={feature} requiredPlan={plan} />;
}
