export type EventType =
  | "reduction"
  | "happy_hour"
  | "menu_special"
  | "double_points"
  | "offre_libre";

export type EventDiscountType = "percent" | "amount";

export type EventAppliesTo = "all" | "category" | "item";

export type RestaurantEvent = {
  id: string;
  restaurantId: string;
  title: string;
  description: string | null;
  type: EventType;
  discountType: EventDiscountType | null;
  discountValue: number | null;
  loyaltyBonus: number | null;
  appliesTo: EventAppliesTo;
  appliesToId: string | null;
  daysOfWeek: number[]; // 1 = lundi, 7 = dimanche
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null;
  startTime: string | null; // HH:MM
  endTime: string | null;
  displayOnCarte: boolean;
  color: string;
  active: boolean;
  createdAt: string;
};

export type EventPayload = Omit<RestaurantEvent, "id" | "restaurantId" | "createdAt">;

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  reduction: "Réduction",
  happy_hour: "Happy Hour",
  menu_special: "Menu spécial",
  double_points: "Bonus fidélité",
  offre_libre: "Offre libre",
};

export const EVENT_TYPE_HINT: Record<EventType, string> = {
  reduction: "-X% ou -X€ sur l'addition, une catégorie ou un plat",
  happy_hour: "Boissons à prix réduit sur un créneau horaire",
  menu_special: "Formule du jour à prix fixe",
  double_points: "Multiplicateur de points fidélité",
  offre_libre: "Texte libre, ex. « Pain offert à table »",
};

export const EVENT_PALETTE: { name: string; value: string }[] = [
  { name: "Ember", value: "#e8733a" },
  { name: "Or", value: "#d29528" },
  { name: "Olive", value: "#8a8a3f" },
  { name: "Forêt", value: "#6ab38e" },
  { name: "Lagune", value: "#4f8a9a" },
  { name: "Indigo", value: "#5b6ec4" },
  { name: "Prune", value: "#9b5a8b" },
  { name: "Rouille", value: "#b5563a" },
];

export const DAYS: { num: number; short: string; long: string }[] = [
  { num: 1, short: "Lun", long: "Lundi" },
  { num: 2, short: "Mar", long: "Mardi" },
  { num: 3, short: "Mer", long: "Mercredi" },
  { num: 4, short: "Jeu", long: "Jeudi" },
  { num: 5, short: "Ven", long: "Vendredi" },
  { num: 6, short: "Sam", long: "Samedi" },
  { num: 7, short: "Dim", long: "Dimanche" },
];

// JS getDay(): 0 = dim, 1..6 = lun..sam — on convertit vers 1..7 (lun..dim).
export function isoDay(d: Date): number {
  const w = d.getDay();
  return w === 0 ? 7 : w;
}

function timeWithinRange(
  now: Date,
  startTime: string | null,
  endTime: string | null
): boolean {
  if (!startTime && !endTime) return true;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const toMin = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + (m ?? 0);
  };
  const a = startTime ? toMin(startTime) : 0;
  const b = endTime ? toMin(endTime) : 24 * 60;
  if (a <= b) return minutes >= a && minutes <= b;
  // Plage qui chevauche minuit (ex. 22:00 → 02:00)
  return minutes >= a || minutes <= b;
}

function dateOnly(iso: string): Date {
  // Ignore les fuseaux : YYYY-MM-DD interprété comme date locale.
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export type EventStatus = "active" | "scheduled" | "expired";

export function eventStatus(e: RestaurantEvent, now = new Date()): EventStatus {
  if (!e.active) return "expired";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = e.startDate ? dateOnly(e.startDate) : null;
  const end = e.endDate ? dateOnly(e.endDate) : null;
  if (start && today < start) return "scheduled";
  if (end && today > end) return "expired";
  return "active";
}

export function isActiveNow(e: RestaurantEvent, now = new Date()): boolean {
  if (!e.active) return false;
  if (eventStatus(e, now) !== "active") return false;
  // Récurrence par jours de la semaine
  if (e.daysOfWeek.length > 0 && !e.daysOfWeek.includes(isoDay(now))) {
    return false;
  }
  return timeWithinRange(now, e.startTime, e.endTime);
}

export function eventOccursOnDay(e: RestaurantEvent, day: Date): boolean {
  const start = e.startDate ? dateOnly(e.startDate) : null;
  const end = e.endDate ? dateOnly(e.endDate) : null;
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  if (start && d < start) return false;
  if (end && d > end) return false;
  if (e.daysOfWeek.length > 0 && !e.daysOfWeek.includes(isoDay(d))) return false;
  return true;
}

export function summarizeEvent(e: RestaurantEvent): string {
  switch (e.type) {
    case "reduction": {
      const sign = e.discountType === "percent" ? "%" : "€";
      const v = e.discountValue ?? 0;
      const target =
        e.appliesTo === "all"
          ? "l'addition"
          : e.appliesTo === "category"
          ? "la catégorie"
          : "ce plat";
      return `-${v}${sign} sur ${target}`;
    }
    case "happy_hour": {
      const v = e.discountValue ?? 0;
      const range = e.startTime && e.endTime ? ` ${e.startTime}–${e.endTime}` : "";
      return `Happy Hour · -${v}% sur les boissons${range}`;
    }
    case "menu_special": {
      const v = e.discountValue ?? 0;
      return `Menu à ${v}€`;
    }
    case "double_points": {
      const x = e.loyaltyBonus ?? 2;
      return `×${x} points fidélité`;
    }
    case "offre_libre":
      return e.description ?? "Offre spéciale";
  }
}

export function hasOverlap(
  a: RestaurantEvent,
  b: RestaurantEvent
): boolean {
  if (a.id === b.id) return false;
  // Intersection des jours (ou tous les jours si vide)
  const aDays = a.daysOfWeek.length === 0 ? [1, 2, 3, 4, 5, 6, 7] : a.daysOfWeek;
  const bDays = b.daysOfWeek.length === 0 ? [1, 2, 3, 4, 5, 6, 7] : b.daysOfWeek;
  if (!aDays.some((d) => bDays.includes(d))) return false;
  // Intersection des plages de dates
  const aStart = a.startDate ? dateOnly(a.startDate) : null;
  const aEnd = a.endDate ? dateOnly(a.endDate) : null;
  const bStart = b.startDate ? dateOnly(b.startDate) : null;
  const bEnd = b.endDate ? dateOnly(b.endDate) : null;
  if (aStart && bEnd && aStart > bEnd) return false;
  if (bStart && aEnd && bStart > aEnd) return false;
  return true;
}
