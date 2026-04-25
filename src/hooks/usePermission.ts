import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isAllowed, mergedPermissions } from "@/config/permissions";

export type UsePermission = {
  can: (resourceId: string) => boolean;
  all: Record<string, boolean>;
};

export function usePermission(): UsePermission {
  const { role, restaurant } = useAuth();
  const overrides = restaurant?.rolePermissions ?? {};

  const all = useMemo(() => mergedPermissions(role, overrides), [role, overrides]);

  const can = useCallback(
    (resourceId: string) => isAllowed(role, resourceId, overrides),
    [role, overrides]
  );

  return { can, all };
}
