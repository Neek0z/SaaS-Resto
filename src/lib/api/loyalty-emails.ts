import { supabase } from "@/lib/supabase";

export type LoyaltyEmailType = "welcome" | "tier_up" | "reward_redeemed";
export type LoyaltyEmailStatus = "pending" | "sending" | "sent" | "failed";

export type LoyaltyEmailRow = {
  id: string;
  restaurantId: string;
  customerId: string | null;
  toEmail: string;
  type: LoyaltyEmailType;
  status: LoyaltyEmailStatus;
  attempts: number;
  lastError: string | null;
  resendId: string | null;
  scheduledFor: string;
  sentAt: string | null;
  createdAt: string;
};

type Row = {
  id: string;
  restaurant_id: string;
  customer_id: string | null;
  to_email: string;
  type: LoyaltyEmailType;
  status: LoyaltyEmailStatus;
  attempts: number;
  last_error: string | null;
  resend_id: string | null;
  scheduled_for: string;
  sent_at: string | null;
  created_at: string;
};

function map(r: Row): LoyaltyEmailRow {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    customerId: r.customer_id,
    toEmail: r.to_email,
    type: r.type,
    status: r.status,
    attempts: r.attempts,
    lastError: r.last_error,
    resendId: r.resend_id,
    scheduledFor: r.scheduled_for,
    sentAt: r.sent_at,
    createdAt: r.created_at,
  };
}

function requireClient() {
  if (!supabase) throw new Error("Supabase non configuré.");
  return supabase;
}

export async function fetchRecentLoyaltyEmails(
  restaurantId: string,
  limit = 30
): Promise<LoyaltyEmailRow[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("loyalty_email_outbox")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Row[]).map(map);
}

export type ProcessEmailsResult = {
  ok: boolean;
  sent: number;
  failed: number;
  total: number;
  error?: string;
};

/** Invoque l'edge function process-loyalty-emails (Resend). */
export async function processLoyaltyEmails(
  restaurantId?: string | null
): Promise<ProcessEmailsResult> {
  const sb = requireClient();
  const { data, error } = await sb.functions.invoke("process-loyalty-emails", {
    body: restaurantId ? { restaurant_id: restaurantId } : {},
  });
  if (error) {
    return { ok: false, sent: 0, failed: 0, total: 0, error: error.message };
  }
  return data as ProcessEmailsResult;
}
