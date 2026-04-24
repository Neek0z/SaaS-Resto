export type Plan = "essentiel" | "pro" | "multi";

export type Feature =
  | "dashboard"
  | "menu"
  | "reservations"
  | "qrcode"
  | "fidelite"
  | "suivi_client"
  | "emailing"
  | "evenements"
  | "multi_etablissements"
  | "sms";

export const PLAN_ORDER: Plan[] = ["essentiel", "pro", "multi"];

export const PLAN_FEATURES: Record<Plan, Feature[]> = {
  essentiel: ["dashboard", "menu", "reservations", "qrcode"],
  pro: [
    "dashboard",
    "menu",
    "reservations",
    "qrcode",
    "fidelite",
    "suivi_client",
    "emailing",
    "evenements",
  ],
  multi: [
    "dashboard",
    "menu",
    "reservations",
    "qrcode",
    "fidelite",
    "suivi_client",
    "emailing",
    "evenements",
    "multi_etablissements",
    "sms",
  ],
};

export const PLAN_LABELS: Record<Plan, string> = {
  essentiel: "Essentiel",
  pro: "Pro",
  multi: "Multi",
};

export const PLAN_PRICES: Record<Plan, { monthly: number; yearly: number }> = {
  essentiel: { monthly: 29, yearly: 290 },
  pro: { monthly: 59, yearly: 590 },
  multi: { monthly: 99, yearly: 990 },
};

export const FEATURE_LABELS: Record<Feature, string> = {
  dashboard: "Tableau de bord",
  menu: "Menu & carte",
  reservations: "Réservations",
  qrcode: "QR code & menu numérique",
  fidelite: "Programme de fidélité",
  suivi_client: "Suivi client avancé",
  emailing: "Campagnes email",
  evenements: "Gestion d'événements",
  multi_etablissements: "Multi-établissements",
  sms: "Notifications SMS",
};

export function featureMinPlan(feature: Feature): Plan {
  for (const plan of PLAN_ORDER) {
    if (PLAN_FEATURES[plan].includes(feature)) return plan;
  }
  return "multi";
}

export function planRank(plan: Plan): number {
  return PLAN_ORDER.indexOf(plan);
}

// Mettre à `false` (ou un autre plan) pour tester les restrictions.
export const DEV_OVERRIDE_PLAN: Plan | false = "multi";
