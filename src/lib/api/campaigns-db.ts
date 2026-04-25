import { supabase } from "@/lib/supabase";
import type {
  Campaign,
  CampaignContent,
  CampaignPayload,
  CampaignRecipient,
  CampaignStatus,
  CampaignType,
  RecipientStatus,
  SegmentFilters,
} from "@/lib/crm-types";
import { EMPTY_SEGMENT } from "@/lib/crm-types";

type CampaignRow = {
  id: string;
  restaurant_id: string;
  type: CampaignType;
  subject: string;
  sender_name: string | null;
  reply_to: string | null;
  content: Partial<CampaignContent> | null;
  template_id: string | null;
  segment: Partial<SegmentFilters> | null;
  status: CampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  open_count: number;
  click_count: number;
  bounce_count: number;
  created_at: string;
  updated_at: string;
};

type RecipientRow = {
  id: string;
  campaign_id: string;
  customer_id: string | null;
  email: string;
  status: RecipientStatus;
  error: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  resend_id: string | null;
  created_at: string;
};

function emptyContent(): CampaignContent {
  return { title: "", body: "", cta_text: null, cta_url: null, image_url: null };
}

function mapCampaign(r: CampaignRow): Campaign {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    type: r.type,
    subject: r.subject,
    senderName: r.sender_name,
    replyTo: r.reply_to,
    content: { ...emptyContent(), ...(r.content ?? {}) },
    templateId: r.template_id,
    segment: { ...EMPTY_SEGMENT, ...(r.segment ?? {}) },
    status: r.status,
    scheduledAt: r.scheduled_at,
    sentAt: r.sent_at,
    recipientCount: r.recipient_count,
    openCount: r.open_count,
    clickCount: r.click_count,
    bounceCount: r.bounce_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapRecipient(r: RecipientRow): CampaignRecipient {
  return {
    id: r.id,
    campaignId: r.campaign_id,
    customerId: r.customer_id,
    email: r.email,
    status: r.status,
    error: r.error,
    sentAt: r.sent_at,
    openedAt: r.opened_at,
    clickedAt: r.clicked_at,
    resendId: r.resend_id,
    createdAt: r.created_at,
  };
}

function payloadToRow(p: CampaignPayload) {
  return {
    type: p.type,
    subject: p.subject,
    sender_name: p.senderName,
    reply_to: p.replyTo,
    content: p.content,
    template_id: p.templateId,
    segment: p.segment,
    status: p.status,
    scheduled_at: p.scheduledAt,
  };
}

function requireClient() {
  if (!supabase) throw new Error("Supabase non configuré.");
  return supabase;
}

// =============================================================
// Campaigns CRUD
// =============================================================
export async function fetchCampaigns(
  restaurantId: string
): Promise<Campaign[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("campaigns")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as CampaignRow[]).map(mapCampaign);
}

export async function fetchCampaign(id: string): Promise<Campaign | null> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCampaign(data as CampaignRow) : null;
}

export async function createCampaign(
  restaurantId: string,
  payload: CampaignPayload
): Promise<Campaign> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("campaigns")
    .insert({ restaurant_id: restaurantId, ...payloadToRow(payload) })
    .select("*")
    .single();
  if (error) throw error;
  return mapCampaign(data as CampaignRow);
}

export async function updateCampaign(
  id: string,
  payload: CampaignPayload
): Promise<void> {
  const sb = requireClient();
  const { error } = await sb
    .from("campaigns")
    .update(payloadToRow(payload))
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCampaign(id: string): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("campaigns").delete().eq("id", id);
  if (error) throw error;
}

// =============================================================
// Recipients : insertion en masse avant envoi
// =============================================================
export async function createRecipients(
  campaignId: string,
  recipients: { customerId: string | null; email: string }[]
): Promise<number> {
  const sb = requireClient();
  if (recipients.length === 0) return 0;
  // Chunk pour éviter les requêtes trop lourdes
  const CHUNK = 500;
  let total = 0;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const slice = recipients.slice(i, i + CHUNK).map((r) => ({
      campaign_id: campaignId,
      customer_id: r.customerId,
      email: r.email,
      status: "pending" as RecipientStatus,
    }));
    const { error, count } = await sb
      .from("campaign_recipients")
      .insert(slice, { count: "exact" });
    if (error) throw error;
    total += count ?? slice.length;
  }
  // Met à jour le compteur sur la campagne
  await sb
    .from("campaigns")
    .update({ recipient_count: total })
    .eq("id", campaignId);
  return total;
}

export async function fetchRecipients(
  campaignId: string
): Promise<CampaignRecipient[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("campaign_recipients")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as RecipientRow[]).map(mapRecipient);
}

// =============================================================
// Envoi : invoque l'edge function (serveur uniquement)
// =============================================================
async function readEdgeError(error: unknown): Promise<string> {
  // supabase-js attache la Response brute dans `context` pour FunctionsHttpError.
  const ctx = (error as { context?: Response | { message?: string } } | null)?.context;
  if (ctx instanceof Response) {
    try {
      const cloned = ctx.clone();
      const text = await cloned.text();
      try {
        const json = JSON.parse(text) as { error?: string; message?: string };
        const msg = json.error ?? json.message;
        if (msg) {
          if (msg.toLowerCase().includes("configuration"))
            return "Edge function send-campaign : RESEND_API_KEY ou SUPABASE_SERVICE_ROLE_KEY manquant.";
          return msg;
        }
      } catch {
        if (text) return text;
      }
      if (ctx.status === 404) {
        return "Edge function send-campaign introuvable. Déployez-la avec `supabase functions deploy send-campaign`.";
      }
    } catch {
      /* noop */
    }
  }
  if (error instanceof Error) return error.message;
  return "Échec de l'envoi.";
}

export async function sendCampaign(
  campaignId: string,
  restaurantId: string
): Promise<{ ok: boolean; sent: number; failed: number; total: number }> {
  const sb = requireClient();
  const { data, error } = await sb.functions.invoke("send-campaign", {
    body: { campaign_id: campaignId, restaurant_id: restaurantId },
  });
  if (error) {
    const msg = await readEdgeError(error);
    throw new Error(msg);
  }
  return data as { ok: boolean; sent: number; failed: number; total: number };
}
