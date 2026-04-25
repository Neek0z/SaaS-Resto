import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  actionMinRole,
  canRoleDo,
  isRoleAtLeast,
  type Action,
  type Role,
} from "@/config/roles";

export type UseRoleResult = {
  role: Role;
  isAtLeast: (minRole: Role) => boolean;
  canDo: (action: Action) => boolean;
  isRole: (role: Role) => boolean;
  minRoleForAction: (action: Action) => Role;
};

export function useRole(): UseRoleResult {
  const { role } = useAuth();

  return useMemo<UseRoleResult>(
    () => ({
      role,
      isAtLeast: (minRole) => isRoleAtLeast(role, minRole),
      canDo: (action) => canRoleDo(role, action),
      isRole: (r) => role === r,
      minRoleForAction: (action) => actionMinRole(action),
    }),
    [role]
  );
}
