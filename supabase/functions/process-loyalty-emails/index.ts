// Supabase Edge Function : process-loyalty-emails
// =============================================================
// Draine la queue loyalty_email_outbox et envoie via Resend.
// Appelable :
//   - depuis le dashboard staff (POST sans payload, scopé au resto courant)
//   - via cron / hook FE (idem)
//
// Variables d'environnement (à configurer dans Supabase) :
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - RESEND_API_KEY
//   - RESEND_FROM (ex. "Maison Sévère <noreply@severe.app>")
//   - APP_PUBLIC_URL (ex. "https://severe.app") — sert à construire
//     les liens "Mon compte" dans les emails
// =============================================================

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BATCH_SIZE = 50;

type OutboxRow = {
  id: string;
  restaurant_id: string;
  customer_id: string | null;
  to_email: string;
  type: "welcome" | "tier_up" | "reward_redeemed";
  payload: Record<string, any>;
  status: string;
  attempts: number;
};

function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const TIER_LABEL: Record<string, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
  platine: "Platine",
};

function htmlShell(title: string, inner: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f5f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#100d0a">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f1ea;padding:40px 16px">
<tr><td align="center">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
${inner}
</table>
</td></tr></table>
</body></html>`;
}

function escapeHtml(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ctaButton(label: string, url: string): string {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 24px;background:#e8733a;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">${escapeHtml(label)}</a>`;
}

function buildEmail(
  type: OutboxRow["type"],
  payload: Record<string, any>,
  appUrl: string
): { subject: string; html: string } {
  const restaurantName = String(payload.restaurant_name ?? "");
  const customerName = String(payload.customer_name ?? "");
  const slug = String(payload.restaurant_slug ?? "");
  const accountUrl = slug ? `${appUrl}/fidelite/${encodeURIComponent(slug)}/compte` : appUrl;
  const firstName = customerName.split(/\s+/)[0] || "vous";

  if (type === "welcome") {
    const programName = payload.program_name || `Programme fidélité ${restaurantName}`;
    const pointsPerEuro = Number(payload.points_per_euro ?? 10);
    const silver = Number(payload.threshold_silver ?? 500);
    const gold = Number(payload.threshold_gold ?? 1500);
    const subject = `Bienvenue chez ${restaurantName} · ${programName}`;
    const inner = `
<tr><td style="padding:32px 32px 8px">
  <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;line-height:1.2;color:#100d0a">Bienvenue ${escapeHtml(firstName)} !</h1>
  <div style="font-size:15px;line-height:1.6;color:#3a3530">
    ${escapeHtml(payload.welcome_message ?? `Vous faites désormais partie du club fidélité de ${restaurantName}.`)}
  </div>
  <div style="margin-top:20px;padding:16px;background:#f5f1ea;border-radius:10px;font-size:13.5px;color:#3a3530;line-height:1.7">
    <strong>Comment ça marche</strong><br>
    Chaque euro dépensé chez nous vous rapporte ${pointsPerEuro} points.<br>
    À ${silver.toLocaleString("fr-FR")} points : niveau <strong>Argent</strong>.<br>
    À ${gold.toLocaleString("fr-FR")} points : niveau <strong>Or</strong>.<br>
    Vos points sont échangeables contre des récompenses.
  </div>
</td></tr>
<tr><td style="padding:24px 32px 32px">
  ${ctaButton("Voir mon compte fidélité", accountUrl)}
</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid #ece5da;font-size:11px;color:#8b8278;line-height:1.6">
  Vous recevez cet email parce que vous venez de rejoindre le programme fidélité de ${escapeHtml(restaurantName)}.
</td></tr>`;
    return { subject, html: htmlShell(subject, inner) };
  }

  if (type === "tier_up") {
    const newTierLabel = TIER_LABEL[String(payload.new_tier)] ?? String(payload.new_tier);
    const subject = `Bravo ${firstName} — niveau ${newTierLabel} débloqué !`;
    const inner = `
<tr><td style="padding:32px 32px 8px">
  <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;line-height:1.2;color:#100d0a">Niveau ${escapeHtml(newTierLabel)} débloqué 🎉</h1>
  <div style="font-size:15px;line-height:1.6;color:#3a3530">
    Félicitations ${escapeHtml(firstName)} ! Vous venez de passer au niveau <strong>${escapeHtml(newTierLabel)}</strong> chez ${escapeHtml(restaurantName)}.<br><br>
    Vous totalisez désormais <strong>${Number(payload.points ?? 0).toLocaleString("fr-FR")} points</strong>.
  </div>
</td></tr>
<tr><td style="padding:24px 32px 32px">
  ${ctaButton("Voir mes récompenses", accountUrl)}
</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid #ece5da;font-size:11px;color:#8b8278;line-height:1.6">
  Email automatique de votre programme fidélité chez ${escapeHtml(restaurantName)}.
</td></tr>`;
    return { subject, html: htmlShell(subject, inner) };
  }

  // reward_redeemed
  const rewardLabel = String(payload.reward_label ?? "Récompense");
  const used = Number(payload.points_used ?? 0);
  const remaining = Number(payload.remaining_points ?? 0);
  const subject = `${rewardLabel} — votre récompense est réservée`;
  const inner = `
<tr><td style="padding:32px 32px 8px">
  <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;line-height:1.2;color:#100d0a">Récompense réservée ✨</h1>
  <div style="font-size:15px;line-height:1.6;color:#3a3530">
    Bonjour ${escapeHtml(firstName)},<br><br>
    Votre récompense <strong>${escapeHtml(rewardLabel)}</strong> est bien réservée chez ${escapeHtml(restaurantName)}.
    Présentez-vous lors de votre prochaine visite — l'équipe est prévenue.
  </div>
  <div style="margin-top:20px;padding:16px;background:#f5f1ea;border-radius:10px;font-size:13.5px;color:#3a3530;line-height:1.7">
    Points utilisés : <strong>${used.toLocaleString("fr-FR")}</strong><br>
    Solde restant : <strong>${remaining.toLocaleString("fr-FR")} points</strong>
  </div>
</td></tr>
<tr><td style="padding:24px 32px 32px">
  ${ctaButton("Voir mon compte", accountUrl)}
</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid #ece5da;font-size:11px;color:#8b8278;line-height:1.6">
  Confirmation transactionnelle de votre programme fidélité chez ${escapeHtml(restaurantName)}.
</td></tr>`;
  return { subject, html: htmlShell(subject, inner) };
}

async function sendOneEmail(
  resendKey: string,
  payload: { from: string; to: string; subject: string; html: string }
): Promise<{ id: string }> {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Resend ${resp.status}: ${errText}`);
  }
  return resp.json() as Promise<{ id: string }>;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromAddress = Deno.env.get("RESEND_FROM") ?? "onboarding@resend.dev";
  const appUrl = (Deno.env.get("APP_PUBLIC_URL") ?? "").replace(/\/$/, "") || "https://severe.app";

  if (!supabaseUrl || !serviceKey || !resendKey) {
    return new Response(
      JSON.stringify({ error: "Configuration serveur incomplète." }),
      { status: 500, headers: { ...corsHeaders(origin), "content-type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Restaurant scoping (optionnel) — si appel staff, on transmet l'id
  let restaurantId: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body.restaurant_id === "string") {
      restaurantId = body.restaurant_id;
    }
  } catch {
    // pas de body, OK
  }

  // Drain la queue (atomique : status passe à 'sending')
  const { data: claimed, error: claimErr } = await supabase.rpc(
    "claim_pending_loyalty_emails",
    { p_restaurant_id: restaurantId, p_limit: BATCH_SIZE }
  );

  if (claimErr) {
    return new Response(JSON.stringify({ error: claimErr.message }), {
      status: 500,
      headers: { ...corsHeaders(origin), "content-type": "application/json" },
    });
  }

  const list = (claimed ?? []) as OutboxRow[];
  let sent = 0;
  let failed = 0;

  for (const row of list) {
    try {
      const { subject, html } = buildEmail(row.type, row.payload, appUrl);
      const result = await sendOneEmail(resendKey, {
        from: fromAddress,
        to: row.to_email,
        subject,
        html,
      });
      await supabase
        .from("loyalty_email_outbox")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          resend_id: result.id,
          last_error: null,
        })
        .eq("id", row.id);
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase
        .from("loyalty_email_outbox")
        .update({
          status: row.attempts >= 3 ? "failed" : "pending",
          last_error: msg,
        })
        .eq("id", row.id);
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, sent, failed, total: list.length }),
    { status: 200, headers: { ...corsHeaders(origin), "content-type": "application/json" } }
  );
});
