// =============================================================
// Maison Sévère · Permissions paramétrables par rôle
// Baseline en code + overrides par restaurant stockés en JSONB.
// Le plan d'abonnement reste géré séparément (PLAN_FEATURES).
// =============================================================

import type { Role } from "./roles";

export type ResourceCategory = "nav" | "action";

export type ResourceDef = {
  id: string;
  label: string;
  category: ResourceCategory;
  description?: string;
};

// Items de navigation (sidebar). L'id correspond au path.
export const NAV_RESOURCES: ResourceDef[] = [
  { id: "nav.dashboard", label: "Tableau de bord", category: "nav" },
  { id: "nav.commandes", label: "Commandes", category: "nav" },
  { id: "nav.reservations", label: "Réservations", category: "nav" },
  { id: "nav.menu", label: "Menu & stocks", category: "nav" },
  { id: "nav.avis", label: "Avis clients", category: "nav" },
  { id: "nav.equipe", label: "Équipe", category: "nav" },
  { id: "nav.menu-numerique", label: "Menu numérique", category: "nav" },
  { id: "nav.qrcode", label: "QR codes", category: "nav" },
  { id: "nav.fidelite", label: "Fidélité", category: "nav" },
  { id: "nav.evenements", label: "Événements", category: "nav" },
  { id: "nav.clients", label: "Clients", category: "nav" },
];

// Actions sensibles dans les pages.
export const ACTION_RESOURCES: ResourceDef[] = [
  {
    id: "action.view_margins",
    label: "Voir les marges & panier moyen",
    category: "action",
    description: "Affiche les KPIs financiers sur le dashboard.",
  },
  {
    id: "action.edit_menu",
    label: "Modifier le menu",
    category: "action",
  },
  {
    id: "action.edit_reservations",
    label: "Créer / modifier les réservations",
    category: "action",
  },
  {
    id: "action.export_data",
    label: "Exporter les données",
    category: "action",
  },
];

export const ALL_RESOURCES: ResourceDef[] = [...NAV_RESOURCES, ...ACTION_RESOURCES];

export type ResourceId = (typeof ALL_RESOURCES)[number]["id"];

// -------------------------------------------------------------
// Baseline : valeurs par défaut si l'owner n'a rien personnalisé.
// L'owner peut tout cocher/décocher sauf pour soi-même et le dev.
// -------------------------------------------------------------
type RolePermissionMap = Record<string, boolean>;

const ALL_TRUE: RolePermissionMap = Object.fromEntries(
  ALL_RESOURCES.map((r) => [r.id, true])
);

const EMPLOYEE_BASELINE: RolePermissionMap = Object.fromEntries(
  ALL_RESOURCES.map((r) => [r.id, false])
);
// L'employé bascule sur /service donc la sidebar n'est pas vraiment
// pertinente, mais on lui ouvre un minimum si jamais il revient sur
// le shell (ex. dev qui simule).
EMPLOYEE_BASELINE["nav.commandes"] = true;
EMPLOYEE_BASELINE["nav.reservations"] = true;

const MANAGER_BASELINE: RolePermissionMap = {
  ...ALL_TRUE,
  "nav.equipe": false,
  "nav.clients": false,
  "nav.fidelite": false,
  "action.view_margins": false,
  "action.export_data": false,
};

export const BASELINE_PERMISSIONS: Record<Role, RolePermissionMap> = {
  employee: EMPLOYEE_BASELINE,
  manager: MANAGER_BASELINE,
  owner: { ...ALL_TRUE },
  developer: { ...ALL_TRUE },
};

// -------------------------------------------------------------
// Forme stockée en BDD : seuls les deltas par rapport au baseline.
// { "manager": { "nav.equipe": false } }
// -------------------------------------------------------------
export type PermissionOverrides = Partial<Record<Role, Partial<Record<string, boolean>>>>;

export function isAllowed(
  role: Role,
  resourceId: string,
  overrides: PermissionOverrides | null | undefined
): boolean {
  // Owner et developer ont toujours accès, point. On ne laisse pas
  // le owner se priver lui-même par accident, et le dev doit toujours
  // pouvoir débuger.
  if (role === "owner" || role === "developer") return true;

  const override = overrides?.[role]?.[resourceId];
  if (typeof override === "boolean") return override;
  return BASELINE_PERMISSIONS[role][resourceId] ?? false;
}

export function mergedPermissions(
  role: Role,
  overrides: PermissionOverrides | null | undefined
): RolePermissionMap {
  if (role === "owner" || role === "developer") return ALL_TRUE;
  const baseline = BASELINE_PERMISSIONS[role];
  const delta = overrides?.[role] ?? {};
  return Object.fromEntries(
    ALL_RESOURCES.map((r) => {
      const v = delta[r.id];
      return [r.id, typeof v === "boolean" ? v : (baseline[r.id] ?? false)];
    })
  );
}

// Rôles paramétrables dans l'UI (employee + manager). Owner et dev
// sont en lecture seule (toujours tout coché).
export const CONFIGURABLE_ROLES: Role[] = ["employee", "manager"];
