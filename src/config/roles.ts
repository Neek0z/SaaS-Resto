export type Role = "employee" | "manager" | "owner" | "developer";

export const ROLE_ORDER: Role[] = ["employee", "manager", "owner", "developer"];

export const ROLE_LABELS: Record<Role, string> = {
  employee: "Employé",
  manager: "Manager",
  owner: "Propriétaire",
  developer: "Développeur",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  employee: "Vue opérationnelle · service uniquement",
  manager: "Pilotage complet hors facturation",
  owner: "Accès total + facturation & équipe",
  developer: "Owner + outils techniques",
};

export function roleRank(role: Role): number {
  return ROLE_ORDER.indexOf(role);
}

export function isRoleAtLeast(actual: Role, min: Role): boolean {
  return roleRank(actual) >= roleRank(min);
}

export type Action =
  | "view_financials"
  | "view_margins"
  | "edit_menu"
  | "manage_users"
  | "view_reservations"
  | "edit_orders"
  | "edit_reservations"
  | "access_settings"
  | "access_billing"
  | "export_data"
  | "view_dev_tools";

const ACTION_MIN_ROLE: Record<Action, Role> = {
  view_financials: "manager",
  view_margins: "owner",
  edit_menu: "manager",
  manage_users: "owner",
  view_reservations: "employee",
  edit_orders: "employee",
  edit_reservations: "manager",
  access_settings: "manager",
  access_billing: "owner",
  export_data: "owner",
  view_dev_tools: "developer",
};

export function actionMinRole(action: Action): Role {
  return ACTION_MIN_ROLE[action];
}

export function canRoleDo(role: Role, action: Action): boolean {
  return isRoleAtLeast(role, ACTION_MIN_ROLE[action]);
}

// Override pour tests UI sans changer Supabase. `false` = utilise le rôle réel.
export const DEV_OVERRIDE_ROLE: Role | false = false;
