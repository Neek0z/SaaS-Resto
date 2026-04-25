// Maison Sévère — brasserie contemporaine, Paris 11e
// Mock data mirroring the design reference

export const RESTO = {
  name: "Maison Sévère",
  tagline: "Brasserie · Paris 11ᵉ",
  date: "Vendredi 24 avril 2026",
  service: "Service du soir",
};

export const KPIS = {
  revenue: {
    today: 4287,
    todayDelta: 12.4,
    week: 26840,
    weekDelta: 8.1,
    month: 108420,
    monthDelta: -2.3,
  },
  covers: { value: 142, delta: 9.2, goal: 160 },
  avgTicket: { value: 42.6, delta: 3.1 },
  occupancy: {
    value: 78,
    delta: 14,
    tables: { occupied: 22, total: 28 },
  },
};

export type RevenueDay = { day: string; lunch: number; dinner: number };
export const REVENUE_7D: RevenueDay[] = [
  { day: "Sam", lunch: 1820, dinner: 3140 },
  { day: "Dim", lunch: 2410, dinner: 2980 },
  { day: "Lun", lunch: 0, dinner: 0 },
  { day: "Mar", lunch: 1420, dinner: 2680 },
  { day: "Mer", lunch: 1680, dinner: 2920 },
  { day: "Jeu", lunch: 1910, dinner: 3240 },
  { day: "Ven", lunch: 1247, dinner: 3040 },
];

export type CoverSlot = { t: string; v: number };
export const COVERS_BY_SLOT: CoverSlot[] = [
  { t: "12:00", v: 8 },
  { t: "12:30", v: 22 },
  { t: "13:00", v: 31 },
  { t: "13:30", v: 24 },
  { t: "14:00", v: 11 },
  { t: "14:30", v: 4 },
  { t: "19:00", v: 6 },
  { t: "19:30", v: 18 },
  { t: "20:00", v: 34 },
  { t: "20:30", v: 41 },
  { t: "21:00", v: 38 },
  { t: "21:30", v: 22 },
  { t: "22:00", v: 12 },
  { t: "22:30", v: 5 },
];

export type { OrderStatus, OrderChannel, OrderPriority, Order } from "@/lib/order-types";
import type { Order as _Order, OrderStatus as _OS, OrderChannel as _OC } from "@/lib/order-types";

const _stubOrder = (
  i: number,
  displayId: string,
  table: string,
  covers: number,
  items: string[],
  total: number,
  status: _OS,
  channel: _OC,
  waiter: string,
  priority: "high" | "normal",
  pickup = ""
): _Order => ({
  id: `mock-order-${i}`,
  restaurantId: "mock",
  displayId,
  table,
  covers,
  items,
  total,
  status,
  channel,
  waiter,
  priority,
  pickup,
  note: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const ORDERS: _Order[] = [
  _stubOrder(1, "T-12", "Table 12", 4, ["Tartare de bœuf", "Sole meunière", "Côte de porc", "Salade César"], 168, "preparing", "salle", "Léa", "high"),
  _stubOrder(2, "T-07", "Table 7", 2, ["Velouté de panais", "Risotto champignons"], 58, "pending", "salle", "Karim", "normal"),
  _stubOrder(3, "CC-284", "Click & Collect", 1, ["Menu du jour ×2", "Tarte citron"], 39, "preparing", "cc", "—", "normal", "20:45"),
  _stubOrder(4, "T-03", "Table 3", 3, ["Entrecôte ×2", "Poulet rôti", "Crème brûlée"], 127, "served", "salle", "Léa", "normal"),
  _stubOrder(5, "LV-912", "Livraison · Deliveroo", 1, ["Burger Sévère", "Frites maison"], 24, "pending", "delivery", "—", "high"),
  _stubOrder(6, "T-15", "Table 15", 2, ["Plateau fruits de mer"], 89, "preparing", "salle", "Ines", "normal"),
  _stubOrder(7, "T-09", "Table 9", 6, ["Menu dégustation ×6"], 468, "preparing", "salle", "Karim", "high"),
  _stubOrder(8, "T-02", "Table 2", 2, ["Magret de canard", "Soupe de poisson"], 72, "cancelled", "salle", "Léa", "normal"),
];

export type { ResaStatus, Reservation } from "@/lib/reservation-types";
import type { Reservation as _Reservation } from "@/lib/reservation-types";

const _today = new Date().toISOString().slice(0, 10);
const _now = new Date().toISOString();
const _stubResa = (
  i: number,
  t: string,
  n: string,
  c: number,
  tb: string,
  s: _Reservation["status"],
  note: string
): _Reservation => ({
  id: `mock-${i}`,
  restaurantId: "mock",
  date: _today,
  time: t,
  name: n,
  covers: c,
  table: tb,
  status: s,
  note,
  phone: "",
  email: "",
  durationMinutes: 90,
  source: "manual",
  createdAt: _now,
  updatedAt: _now,
});

export const RESERVATIONS: _Reservation[] = [
  _stubResa(1, "19:00", "Mme Laurent", 2, "T4", "seated", "Anniversaire"),
  _stubResa(2, "19:15", "M. Alvarez", 4, "T12", "seated", ""),
  _stubResa(3, "19:30", "Famille Cohen", 5, "T9", "seated", "1 enfant"),
  _stubResa(4, "19:45", "M. Nakamura", 2, "T7", "confirmed", "Allergie arachide"),
  _stubResa(5, "20:00", "Mme Dubois", 3, "T15", "confirmed", "Végétarien"),
  _stubResa(6, "20:00", "Groupe Renault", 8, "T20", "confirmed", "Repas d'affaires"),
  _stubResa(7, "20:15", "M. Bianchi", 2, "T5", "confirmed", ""),
  _stubResa(8, "20:30", "Mme Okafor", 4, "T18", "confirmed", "Proche fenêtre"),
  _stubResa(9, "20:45", "M. Traoré", 2, "T3", "confirmed", ""),
  _stubResa(10, "21:00", "Mme Weiss", 3, "T11", "confirmed", ""),
  _stubResa(11, "21:15", "M. Peretti", 2, "T6", "noshow", "No-show hier"),
];

export type StockLevel = "ok" | "low" | "out";
export type MenuItem = {
  name: string;
  cat: string;
  sold: number;
  stock: StockLevel;
  margin: number;
  trend: number;
};

export const MENU_PERF: MenuItem[] = [
  { name: "Entrecôte grillée, sauce béarnaise", cat: "Plat", sold: 38, stock: "ok", margin: 68, trend: 12 },
  { name: "Tartare de bœuf au couteau", cat: "Entrée", sold: 31, stock: "ok", margin: 72, trend: 8 },
  { name: "Sole meunière", cat: "Plat", sold: 24, stock: "low", margin: 61, trend: -4 },
  { name: "Burger Sévère", cat: "Plat", sold: 22, stock: "ok", margin: 74, trend: 18 },
  { name: "Crème brûlée à la fève tonka", cat: "Dessert", sold: 41, stock: "ok", margin: 81, trend: 22 },
  { name: "Plateau de fruits de mer", cat: "Plat", sold: 9, stock: "out", margin: 54, trend: 0 },
  { name: "Velouté de panais, huile de noisette", cat: "Entrée", sold: 18, stock: "ok", margin: 77, trend: 6 },
];

export type ReviewSource = "Google" | "TripAdvisor" | "TheFork";
export type Review = {
  id: string;
  source: ReviewSource;
  author: string;
  rating: number; // normalized to /5 for display
  scale: number;
  time: string;
  text: string;
  replied: boolean;
};

export const REVIEWS = {
  google: { rating: 4.6, count: 1284, delta: 0.1, scale: 5 },
  tripadvisor: { rating: 4.4, count: 872, delta: 0.0, scale: 5 },
  thefork: { rating: 9.2, count: 451, delta: 0.3, scale: 10 },
  recent: [
    {
      id: "r-001",
      source: "Google",
      author: "Camille R.",
      rating: 5,
      scale: 5,
      time: "il y a 2h",
      text: "Service impeccable, la sole est un régal. On reviendra pour l'anniversaire de maman.",
      replied: false,
    },
    {
      id: "r-002",
      source: "TheFork",
      author: "Marco P.",
      rating: 4,
      scale: 5,
      time: "il y a 5h",
      text: "Cadre chaleureux, cuisine maîtrisée. Un poil bruyant à 21h mais c'est le charme d'une vraie brasserie.",
      replied: true,
    },
    {
      id: "r-003",
      source: "TripAdvisor",
      author: "Sophie L.",
      rating: 2,
      scale: 5,
      time: "hier",
      text: "Attente longue à l'entrée malgré la réservation. Le tartare manquait de caractère ce soir-là.",
      replied: false,
    },
    {
      id: "r-004",
      source: "Google",
      author: "Jean-Marc V.",
      rating: 5,
      scale: 5,
      time: "hier",
      text: "Entrecôte parfaite, béarnaise divine. Karim aux petits soins.",
      replied: true,
    },
    {
      id: "r-005",
      source: "TheFork",
      author: "Chloé D.",
      rating: 5,
      scale: 5,
      time: "il y a 2 j",
      text: "Plateau de fruits de mer incroyable, accueil charmant. Le menu du chef surprend à chaque plat.",
      replied: true,
    },
    {
      id: "r-006",
      source: "Google",
      author: "Antoine B.",
      rating: 3,
      scale: 5,
      time: "il y a 3 j",
      text: "Cuisine correcte mais addition un peu salée pour ce qui est proposé. Le dessert sauve le repas.",
      replied: false,
    },
    {
      id: "r-007",
      source: "TripAdvisor",
      author: "Elena M.",
      rating: 4,
      scale: 5,
      time: "il y a 4 j",
      text: "Très bon moment, le risotto aux champignons était remarquable. Petit bémol sur le service un peu lent en début de soirée.",
      replied: true,
    },
    {
      id: "r-008",
      source: "Google",
      author: "Philippe T.",
      rating: 1,
      scale: 5,
      time: "il y a 5 j",
      text: "Déception complète. Plat froid, serveur pressé, réservation oubliée à l'arrivée. Je ne reviendrai pas.",
      replied: false,
    },
    {
      id: "r-009",
      source: "TheFork",
      author: "Sarah K.",
      rating: 5,
      scale: 5,
      time: "il y a 6 j",
      text: "Parfait pour un dîner d'affaires. Cadre sobre, cuisine inventive, sommelier de bon conseil.",
      replied: true,
    },
    {
      id: "r-010",
      source: "Google",
      author: "Thomas L.",
      rating: 4,
      scale: 5,
      time: "la semaine dernière",
      text: "Très bonne brasserie, carte bien pensée. La crème brûlée à la fève tonka est à tomber.",
      replied: true,
    },
  ] as Review[],
};

export type TeamMemberStatus = "service" | "break" | "late";
export type TeamMemberKind = "service" | "kitchen" | "bar" | "late";
export type TeamMember = {
  name: string;
  role: string;
  status: TeamMemberStatus;
  avatar: string;
  hours: string;
  start: number;
  end: number;
  kind: TeamMemberKind;
  breakStart?: number;
  breakEnd?: number;
};

export const TEAM: TeamMember[] = [
  { name: "Léa Moreau", role: "Cheffe de rang", status: "service", avatar: "LM", hours: "17:00–00:00", start: 17, end: 24, kind: "service" },
  { name: "Karim Bensaïd", role: "Chef de rang", status: "service", avatar: "KB", hours: "17:00–00:00", start: 17, end: 24, kind: "service", breakStart: 19, breakEnd: 19.5 },
  { name: "Ines Nguyen", role: "Runner", status: "service", avatar: "IN", hours: "18:00–23:00", start: 18, end: 23, kind: "service" },
  { name: "Théo Laurent", role: "Sous-chef", status: "service", avatar: "TL", hours: "15:00–00:00", start: 15, end: 24, kind: "kitchen", breakStart: 17, breakEnd: 18 },
  { name: "Marta Silva", role: "Commis", status: "break", avatar: "MS", hours: "16:00–23:00", start: 16, end: 23, kind: "kitchen", breakStart: 19.5, breakEnd: 20.25 },
  { name: "Yann Gauthier", role: "Bar", status: "service", avatar: "YG", hours: "18:00–02:00", start: 18, end: 26, kind: "bar" },
  { name: "Sofia Rossi", role: "Accueil", status: "late", avatar: "SR", hours: "18:30→", start: 18.75, end: 24, kind: "late" },
];

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platine";

export type LoyaltyCustomer = {
  id: string;
  name: string;
  avatar: string;
  email: string;
  tier: LoyaltyTier;
  points: number;
  visits: number;
  spent: number;
  lastVisit: string;
  favorite: string;
};

export type LoyaltyReward = {
  id: string;
  name: string;
  cost: number;
  description: string;
  claimed: number;
  active: boolean;
};

export const LOYALTY = {
  members: 324,
  membersDelta: 11.2,
  active30d: 187,
  redeemed30d: 42,
  avgVisits: 3.8,
  retention: 68,
  tiers: [
    { key: "bronze" as LoyaltyTier, label: "Bronze", threshold: 0, count: 142, color: "#8a6a41" },
    { key: "silver" as LoyaltyTier, label: "Argent", threshold: 500, count: 98, color: "#b8b3a8" },
    { key: "gold" as LoyaltyTier, label: "Or", threshold: 1500, count: 61, color: "#d29528" },
    { key: "platine" as LoyaltyTier, label: "Platine", threshold: 3500, count: 23, color: "#e8c471" },
  ],
  customers: [
    { id: "c-001", name: "Camille Rousseau", avatar: "CR", email: "camille.r@mail.com", tier: "platine" as LoyaltyTier, points: 4820, visits: 42, spent: 3840, lastVisit: "Hier", favorite: "Entrecôte béarnaise" },
    { id: "c-002", name: "Jean-Marc Vidal", avatar: "JV", email: "jm.vidal@mail.com", tier: "gold" as LoyaltyTier, points: 2140, visits: 18, spent: 1720, lastVisit: "Il y a 3 j", favorite: "Plateau fruits de mer" },
    { id: "c-003", name: "Sophie Laurent", avatar: "SL", email: "sophie.l@mail.com", tier: "silver" as LoyaltyTier, points: 890, visits: 9, spent: 620, lastVisit: "Il y a 1 sem.", favorite: "Sole meunière" },
    { id: "c-004", name: "Marco Peretti", avatar: "MP", email: "m.peretti@mail.com", tier: "gold" as LoyaltyTier, points: 1680, visits: 14, spent: 1240, lastVisit: "Hier", favorite: "Burger Sévère" },
    { id: "c-005", name: "Chloé Durand", avatar: "CD", email: "chloe.d@mail.com", tier: "platine" as LoyaltyTier, points: 5410, visits: 51, spent: 4210, lastVisit: "Aujourd'hui", favorite: "Menu dégustation" },
    { id: "c-006", name: "Antoine Bernard", avatar: "AB", email: "a.bernard@mail.com", tier: "bronze" as LoyaltyTier, points: 320, visits: 4, spent: 280, lastVisit: "Il y a 2 sem.", favorite: "Tartare de bœuf" },
    { id: "c-007", name: "Elena Martinez", avatar: "EM", email: "elena.m@mail.com", tier: "silver" as LoyaltyTier, points: 1120, visits: 11, spent: 840, lastVisit: "Il y a 4 j", favorite: "Risotto champignons" },
    { id: "c-008", name: "Philippe Toussaint", avatar: "PT", email: "p.toussaint@mail.com", tier: "gold" as LoyaltyTier, points: 1920, visits: 16, spent: 1540, lastVisit: "Il y a 5 j", favorite: "Crème brûlée" },
  ] as LoyaltyCustomer[],
  rewards: [
    { id: "r-01", name: "Apéritif offert", cost: 200, description: "Coupe de champagne ou cocktail signature", claimed: 118, active: true },
    { id: "r-02", name: "Dessert maison offert", cost: 350, description: "Au choix dans la sélection du chef", claimed: 87, active: true },
    { id: "r-03", name: "-15% sur l'addition", cost: 500, description: "Valable en semaine hors boissons", claimed: 42, active: true },
    { id: "r-04", name: "Menu dégustation · duo", cost: 1500, description: "Menu 5 temps pour deux personnes", claimed: 19, active: true },
    { id: "r-05", name: "Soirée privatisée", cost: 4000, description: "Salle à l'étage jusqu'à 12 couverts", claimed: 3, active: true },
  ] as LoyaltyReward[],
};

export type AlertLevel = "high" | "warn" | "info";
export type Alert = {
  type: string;
  text: string;
  level: AlertLevel;
  minutesAgo: number;
};

export const ALERTS: Alert[] = [
  { type: "stock", text: "Sole en rupture dans ~45 min au rythme actuel", level: "warn", minutesAgo: 2 },
  { type: "rh", text: "Sofia en retard de 15 min — accueil non tenu", level: "high", minutesAgo: 9 },
  { type: "review", text: "Nouvel avis 2★ sur TripAdvisor à traiter", level: "warn", minutesAgo: 16 },
  { type: "resa", text: "Table 20 — groupe de 8, prévenir la cuisine à 19:45", level: "info", minutesAgo: 23 },
];
