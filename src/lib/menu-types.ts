export type MenuCategory = {
  id: string;
  restaurantId: string;
  name: string;
  position: number;
  active: boolean;
};

export type MenuItem = {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  photoUrl: string | null;
  available: boolean;
  tags: string[];
  allergenes: string[];
  badge: MenuBadge | null;
  tvaRate: number;
  position: number;
};

export const MENU_TAGS = [
  "végétarien",
  "vegan",
  "sans gluten",
  "sans lactose",
  "fait maison",
  "épicé",
] as const;
export type MenuTag = (typeof MENU_TAGS)[number];

export const MENU_ALLERGENES = [
  "gluten",
  "crustacés",
  "oeufs",
  "poisson",
  "arachides",
  "soja",
  "lait",
  "fruits à coque",
  "céleri",
  "moutarde",
  "sésame",
  "sulfites",
  "lupin",
  "mollusques",
] as const;
export type Allergene = (typeof MENU_ALLERGENES)[number];

export const MENU_BADGES = [
  "nouveau",
  "populaire",
  "fait maison",
  "suggestion du chef",
] as const;
export type MenuBadge = (typeof MENU_BADGES)[number];

export const TVA_RATES = [5.5, 10, 20] as const;
export type TvaRate = (typeof TVA_RATES)[number];

export const TVA_HINTS: Record<TvaRate, string> = {
  5.5: "Boissons sans alcool",
  10: "Plats · restauration sur place",
  20: "Alcool",
};
