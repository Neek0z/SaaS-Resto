export type CustomerSource = "manual" | "reservation" | "fidelite" | "qrcode";

export type Customer = {
  id: string;
  restaurantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: CustomerSource;
  tags: string[];
  visitCount: number;
  totalSpent: number;
  lastVisit: string | null;
  optedInEmail: boolean;
  optedInSms: boolean;
  notes: string | null;
  loyaltyCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerPayload = {
  name: string;
  email: string | null;
  phone: string | null;
  source: CustomerSource;
  tags: string[];
  notes: string | null;
  optedInEmail: boolean;
  optedInSms: boolean;
};

export const SOURCE_LABEL: Record<CustomerSource, string> = {
  manual: "Manuel",
  reservation: "Réservation",
  fidelite: "Fidélité",
  qrcode: "QR code",
};

export const SOURCE_COLOR: Record<CustomerSource, string> = {
  manual: "#8b8278",
  reservation: "#4f8a9a",
  fidelite: "#d29528",
  qrcode: "#6ab38e",
};

// =============================================================
// Segmentation
// =============================================================
export type LoyaltyTierFilter = "bronze" | "silver" | "gold" | "any";
export type RecencyFilter = "all" | "lt30" | "30to90" | "gt90" | "never";

export type SegmentFilters = {
  optedInOnly: boolean;
  loyaltyTier: LoyaltyTierFilter;
  recency: RecencyFilter;
  tags: string[];
  minSpent: number | null;
  source: CustomerSource | "all";
};

export const EMPTY_SEGMENT: SegmentFilters = {
  optedInOnly: true,
  loyaltyTier: "any",
  recency: "all",
  tags: [],
  minSpent: null,
  source: "all",
};

// =============================================================
// Campaigns
// =============================================================
export type CampaignType = "promotion" | "evenement" | "fidelite" | "newsletter";
export type CampaignStatus = "draft" | "scheduled" | "sent" | "failed";

export type CampaignContent = {
  title: string;
  body: string;
  cta_text: string | null;
  cta_url: string | null;
  image_url: string | null;
};

export type Campaign = {
  id: string;
  restaurantId: string;
  type: CampaignType;
  subject: string;
  senderName: string | null;
  replyTo: string | null;
  content: CampaignContent;
  templateId: string | null;
  segment: SegmentFilters;
  status: CampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CampaignPayload = {
  type: CampaignType;
  subject: string;
  senderName: string | null;
  replyTo: string | null;
  content: CampaignContent;
  templateId: string | null;
  segment: SegmentFilters;
  status: CampaignStatus;
  scheduledAt: string | null;
};

export const CAMPAIGN_TYPE_LABEL: Record<CampaignType, string> = {
  promotion: "Promotion",
  evenement: "Événement",
  fidelite: "Fidélité",
  newsletter: "Newsletter",
};

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Brouillon",
  scheduled: "Programmée",
  sent: "Envoyée",
  failed: "Échec",
};

export const CAMPAIGN_STATUS_COLOR: Record<CampaignStatus, string> = {
  draft: "var(--ink-3)",
  scheduled: "var(--ember-soft)",
  sent: "var(--ok)",
  failed: "var(--danger)",
};

export type RecipientStatus =
  | "pending"
  | "sent"
  | "opened"
  | "clicked"
  | "bounced"
  | "failed";

export type CampaignRecipient = {
  id: string;
  campaignId: string;
  customerId: string | null;
  email: string;
  status: RecipientStatus;
  error: string | null;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  resendId: string | null;
  createdAt: string;
};

export const RECIPIENT_STATUS_LABEL: Record<RecipientStatus, string> = {
  pending: "En attente",
  sent: "Envoyé",
  opened: "Ouvert",
  clicked: "Cliqué",
  bounced: "Rebond",
  failed: "Échec",
};

// =============================================================
// Helpers
// =============================================================
export function relativeDate(iso: string | null): string {
  if (!iso) return "Jamais";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} an${Math.floor(diffDays / 365) > 1 ? "s" : ""}`;
}

export function recencyMatches(
  lastVisit: string | null,
  filter: RecencyFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "never") return !lastVisit;
  if (!lastVisit) return false;
  const days = Math.floor(
    (Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (filter === "lt30") return days < 30;
  if (filter === "30to90") return days >= 30 && days <= 90;
  if (filter === "gt90") return days > 90;
  return true;
}

export function customerMatches(
  c: Customer,
  filters: SegmentFilters,
  loyaltyTierByLoyaltyId: Map<string, string>
): boolean {
  if (filters.optedInOnly && !c.optedInEmail) return false;
  if (!c.email && filters.optedInOnly) return false;
  if (filters.source !== "all" && c.source !== filters.source) return false;
  if (!recencyMatches(c.lastVisit, filters.recency)) return false;
  if (
    filters.minSpent !== null &&
    !Number.isNaN(filters.minSpent) &&
    c.totalSpent < filters.minSpent
  )
    return false;
  if (filters.tags.length > 0) {
    if (!filters.tags.every((t) => c.tags.includes(t))) return false;
  }
  if (filters.loyaltyTier !== "any") {
    if (!c.loyaltyCustomerId) return false;
    const tier = loyaltyTierByLoyaltyId.get(c.loyaltyCustomerId);
    if (tier !== filters.loyaltyTier) return false;
  }
  return true;
}
