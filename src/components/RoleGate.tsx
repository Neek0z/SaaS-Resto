import type { ReactNode } from "react";
import { useRole } from "@/hooks/useRole";
import { usePermission } from "@/hooks/usePermission";
import type { Action, Role } from "@/config/roles";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
} & (
  | { action: Action; requiredRole?: undefined; resource?: undefined }
  | { action?: undefined; requiredRole: Role; resource?: undefined }
  | { action?: undefined; requiredRole?: undefined; resource: string }
);

export function RoleGate(props: Props) {
  const { isAtLeast, canDo } = useRole();
  const { can } = usePermission();
  const { children, fallback } = props;

  let ok: boolean;
  if (props.resource) ok = can(props.resource);
  else if (props.action) ok = canDo(props.action);
  else ok = isAtLeast(props.requiredRole as Role);

  if (ok) return <>{children}</>;
  return <>{fallback ?? null}</>;
}
