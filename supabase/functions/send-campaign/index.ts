// Supabase Edge Function : send-campaign
// =============================================================
// Lit la campagne, charge les destinataires en attente, envoie
// par lots via Resend, met à jour les statuts. Jamais appelée
// directement depuis le client React (la clé Resend ne doit
// pas fuiter côté front).
//
// Variables d'environnement (à configurer dans Supabase):
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - RESEND_API_KEY
//   - RESEND_FROM (ex. "Maison Sévère <noreply@severe.app>")
// =============================================================

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BATCH_SIZE = 100;

type CampaignRow = {
  id: string;
  restaurant_id: string;
  subject: string;
  sender_name: string | null;
  reply_to: string | null;
  content: Record<string, unknown>;
  status: string;
};

type RecipientRow = {
  id: string;
  campaign_id: string;
  customer_id: string | null;
  email: string;
  status: string;
};

type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
};

function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function fillVariables(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    String(vars[key] ?? "")
  );
}

function renderEmailHTML(
  content: Record<string, any>,
  vars: Record<string, string | number>,
  unsubscribeLink: string
): string {
  const title = fillVariables(String(content.title ?? ""), vars);
  const body = fillVariables(String(content.body ?? ""), vars);
  const ctaText = content.cta_text ? fillVariables(String(content.cta_text), vars) : null;
  const ctaUrl = content.cta_url ? String(content.cta_url) : null;
  const imageUrl = content.image_url ? String(content.image_url) : null;
  const restaurantName = String(vars["nom_restaurant"] ?? "");

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#100d0a">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f1ea;padding:40px 16px">
<tr><td align="center">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
${imageUrl ? `<tr><td><img src="${imageUrl}" alt="" style="display:block;width:100%;height:auto"></td></tr>` : ""}
<tr><td style="padding:32px 32px 8px">
<h1 style="margin:0 0 16px;font-size:24px;font-weight:600;line-height:1.2;color:#100d0a">${title}</h1>
<div style="font-size:15px;line-height:1.6;color:#3a3530;white-space:pre-wrap">${body}</div>
</td></tr>
${
  ctaText && ctaUrl
    ? `<tr><td style="padding:24px 32px 32px"><a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;background:#e8733a;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">${ctaText}</a></td></tr>`
    : ""
}
<tr><td style="padding:24px 32px 32px;border-top:1px solid #ece5da;font-size:11px;color:#8b8278;line-height:1.6">
Vous recevez cet email car vous êtes client de ${restaurantName}.<br>
<a href="${unsubscribeLink}" style="color:#8b8278;text-decoration:underline">Se désinscrire</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

async function sendOneEmail(
  resendKey: string,
  payload: {
    from: string;
    to: string;
    reply_to: string | null;
    subject: string;
    html: string;
  }
): Promise<{ id: string }> {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: payload.from,
      to: payload.to,
      reply_to: payload.reply_to ?? undefined,
      subject: payload.subject,
      html: payload.html,
    }),
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
  const defaultFrom = Deno.env.get("RESEND_FROM") ?? "onboarding@resend.dev";

  if (!supabaseUrl || !serviceKey || !resendKey) {
    return new Response(
      JSON.stringify({ error: "Configuration serveur incomplète." }),
      { status: 500, headers: { ...corsHeaders(origin), "content-type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  let body: { campaign_id?: string; restaurant_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON invalide." }), {
      status: 400,
      headers: { ...corsHeaders(origin), "content-type": "application/json" },
    });
  }

  const campaignId = body.campaign_id;
  const restaurantId = body.restaurant_id;
  if (!campaignId || !restaurantId) {
    return new Response(
      JSON.stringify({ error: "campaign_id et restaurant_id requis." }),
      { status: 400, headers: { ...corsHeaders(origin), "content-type": "application/json" } }
    );
  }

  // Charge la campagne
  const { data: campaign, error: cErr } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("restaurant_id", restaurantId)
    .single();
  if (cErr || !campaign) {
    return new Response(
      JSON.stringify({ error: cErr?.message ?? "Campagne introuvable." }),
      { status: 404, headers: { ...corsHeaders(origin), "content-type": "application/json" } }
    );
  }
  const camp = campaign as CampaignRow;

  // Charge le restaurant pour le nom
  const { data: resto } = await supabase
    .from("restaurants")
    .select("name")
    .eq("id", restaurantId)
    .single();
  const restaurantName = (resto as { name: string } | null)?.name ?? "";

  // Charge les destinataires en attente
  const { data: recipients, error: rErr } = await supabase
    .from("campaign_recipients")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("status", "pending")
    .limit(BATCH_SIZE);

  if (rErr) {
    return new Response(JSON.stringify({ error: rErr.message }), {
      status: 500,
      headers: { ...corsHeaders(origin), "content-type": "application/json" },
    });
  }

  const list = (recipients ?? []) as RecipientRow[];

  // Hydrate les customers (pour {prenom})
  const customerIds = list
    .map((r) => r.customer_id)
    .filter((id): id is string => Boolean(id));
  let customersById = new Map<string, CustomerRow>();
  if (customerIds.length > 0) {
    const { data: customers } = await supabase
      .from("customers")
      .select("id, name, email")
      .in("id", customerIds);
    customersById = new Map(
      ((customers ?? []) as CustomerRow[]).map((c) => [c.id, c])
    );
  }

  const fromAddress = camp.sender_name
    ? `${camp.sender_name} <${defaultFrom.match(/<([^>]+)>/)?.[1] ?? defaultFrom}>`
    : defaultFrom;

  let sent = 0;
  let failed = 0;

  // Envoi séquentiel pour ne pas dépasser le rate-limit Resend.
  for (const r of list) {
    const customer = r.customer_id ? customersById.get(r.customer_id) : null;
    const firstName =
      customer?.name?.split(/\s+/)[0] ?? r.email.split("@")[0];
    const vars: Record<string, string | number> = {
      prenom: firstName,
      nom: customer?.name ?? "",
      nom_restaurant: restaurantName,
      points: 0,
      niveau: "bronze",
    };
    const unsubscribeLink = `mailto:${camp.reply_to ?? "noreply@severe.app"}?subject=Désinscription`;
    const html = renderEmailHTML(camp.content, vars, unsubscribeLink);
    const subject = fillVariables(camp.subject, vars);

    try {
      const result = await sendOneEmail(resendKey, {
        from: fromAddress,
        to: r.email,
        reply_to: camp.reply_to,
        subject,
        html,
      });
      await supabase
        .from("campaign_recipients")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          resend_id: result.id,
        })
        .eq("id", r.id);
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase
        .from("campaign_recipients")
        .update({ status: "failed", error: msg })
        .eq("id", r.id);
      failed++;
    }
  }

  // Met à jour la campagne
  await supabase
    .from("campaigns")
    .update({
      status: failed > 0 && sent === 0 ? "failed" : "sent",
      sent_at: new Date().toISOString(),
      recipient_count: sent,
    })
    .eq("id", campaignId);

  return new Response(
    JSON.stringify({ ok: true, sent, failed, total: list.length }),
    { status: 200, headers: { ...corsHeaders(origin), "content-type": "application/json" } }
  );
});
