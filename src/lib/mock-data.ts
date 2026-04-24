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

export type OrderStatus = "pending" | "preparing" | "served" | "cancelled";
export type OrderChannel = "salle" | "cc" | "delivery";
export type Order = {
  id: string;
  table: string;
  covers: number;
  items: string[];
  total: number;
  status: OrderStatus;
  time: string;
  channel: OrderChannel;
  waiter: string;
  priority: "high" | "normal";
  pickup?: string;
};

export const ORDERS: Order[] = [
  {
    id: "T-12",
    table: "Table 12",
    covers: 4,
    items: ["Tartare de bœuf", "Sole meunière", "Côte de porc", "Salade César"],
    total: 168,
    status: "preparing",
    time: "il y a 4 min",
    channel: "salle",
    waiter: "Léa",
    priority: "high",
  },
  {
    id: "T-07",
    table: "Table 7",
    covers: 2,
    items: ["Velouté de panais", "Risotto champignons"],
    total: 58,
    status: "pending",
    time: "il y a 1 min",
    channel: "salle",
    waiter: "Karim",
    priority: "normal",
  },
  {
    id: "CC-284",
    table: "Click & Collect",
    covers: 1,
    items: ["Menu du jour ×2", "Tarte citron"],
    total: 39,
    status: "preparing",
    time: "il y a 8 min",
    channel: "cc",
    waiter: "—",
    priority: "normal",
    pickup: "20:45",
  },
  {
    id: "T-03",
    table: "Table 3",
    covers: 3,
    items: ["Entrecôte ×2", "Poulet rôti", "Crème brûlée"],
    total: 127,
    status: "served",
    time: "il y a 2 min",
    channel: "salle",
    waiter: "Léa",
    priority: "normal",
  },
  {
    id: "LV-912",
    table: "Livraison · Deliveroo",
    covers: 1,
    items: ["Burger Sévère", "Frites maison"],
    total: 24,
    status: "pending",
    time: "il y a 30 sec",
    channel: "delivery",
    waiter: "—",
    priority: "high",
  },
  {
    id: "T-15",
    table: "Table 15",
    covers: 2,
    items: ["Plateau fruits de mer"],
    total: 89,
    status: "preparing",
    time: "il y a 12 min",
    channel: "salle",
    waiter: "Ines",
    priority: "normal",
  },
  {
    id: "T-09",
    table: "Table 9",
    covers: 6,
    items: ["Menu dégustation ×6"],
    total: 468,
    status: "preparing",
    time: "il y a 18 min",
    channel: "salle",
    waiter: "Karim",
    priority: "high",
  },
  {
    id: "T-02",
    table: "Table 2",
    covers: 2,
    items: ["Magret de canard", "Soupe de poisson"],
    total: 72,
    status: "cancelled",
    time: "il y a 6 min",
    channel: "salle",
    waiter: "Léa",
    priority: "normal",
  },
];

export type ResaStatus = "seated" | "confirmed" | "noshow";
export type Reservation = {
  time: string;
  name: string;
  covers: number;
  table: string;
  status: ResaStatus;
  note: string;
};

export const RESERVATIONS: Reservation[] = [
  { time: "19:00", name: "Mme Laurent", covers: 2, table: "T4", status: "seated", note: "Anniversaire" },
  { time: "19:15", name: "M. Alvarez", covers: 4, table: "T12", status: "seated", note: "" },
  { time: "19:30", name: "Famille Cohen", covers: 5, table: "T9", status: "seated", note: "1 enfant" },
  { time: "19:45", name: "M. Nakamura", covers: 2, table: "T7", status: "confirmed", note: "Allergie arachide" },
  { time: "20:00", name: "Mme Dubois", covers: 3, table: "T15", status: "confirmed", note: "Végétarien" },
  { time: "20:00", name: "Groupe Renault", covers: 8, table: "T20", status: "confirmed", note: "Repas d'affaires" },
  { time: "20:15", name: "M. Bianchi", covers: 2, table: "T5", status: "confirmed", note: "" },
  { time: "20:30", name: "Mme Okafor", covers: 4, table: "T18", status: "confirmed", note: "Proche fenêtre" },
  { time: "20:45", name: "M. Traoré", covers: 2, table: "T3", status: "confirmed", note: "" },
  { time: "21:00", name: "Mme Weiss", covers: 3, table: "T11", status: "confirmed", note: "" },
  { time: "21:15", name: "M. Peretti", covers: 2, table: "T6", status: "noshow", note: "No-show hier" },
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

export type DigitalMenuCategory = {
  id: string;
  name: string;
  items: { name: string; price: number; description?: string; tag?: string }[];
};

export type DigitalMenuConfig = {
  url: string;
  published: boolean;
  scansToday: number;
  scansWeek: number;
  scansDelta: number;
  avgTime: string;
  conversion: number;
  languages: string[];
  theme: "dark" | "light";
  categories: DigitalMenuCategory[];
};

export const DIGITAL_MENU: DigitalMenuConfig = {
  url: "menu.maison-severe.fr",
  published: true,
  scansToday: 127,
  scansWeek: 842,
  scansDelta: 18.4,
  avgTime: "3 min 24",
  conversion: 62,
  languages: ["FR", "EN", "IT"],
  theme: "dark",
  categories: [
    {
      id: "entrees",
      name: "Entrées",
      items: [
        { name: "Tartare de bœuf au couteau", price: 18, description: "Câpres, échalote, jaune d'œuf bio", tag: "signature" },
        { name: "Velouté de panais, huile de noisette", price: 14, description: "Panais de plein champ, crème légère" },
        { name: "Burrata des Pouilles, tomates anciennes", price: 16, description: "Basilic, huile d'olive Ligurie" },
      ],
    },
    {
      id: "plats",
      name: "Plats",
      items: [
        { name: "Entrecôte grillée, sauce béarnaise", price: 32, description: "Pommes grenaille, salade d'herbes", tag: "signature" },
        { name: "Sole meunière", price: 36, description: "Beurre noisette, citron confit", tag: "limité" },
        { name: "Burger Sévère", price: 22, description: "Bœuf Black Angus, cheddar affiné, oignons confits" },
        { name: "Risotto champignons & truffe", price: 28, description: "Carnaroli, parmesan 24 mois" },
        { name: "Plateau fruits de mer (2 pers.)", price: 68, description: "Huîtres, bulots, crevettes, tourteau", tag: "rupture" },
      ],
    },
    {
      id: "desserts",
      name: "Desserts",
      items: [
        { name: "Crème brûlée à la fève tonka", price: 9, description: "Vanille Bourbon, sucre Muscovado", tag: "signature" },
        { name: "Tarte au citron meringuée", price: 9, description: "Pâte sablée, citron de Menton" },
        { name: "Moelleux chocolat, glace noisette", price: 10, description: "Chocolat 70%, piémont" },
      ],
    },
  ],
};

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
