// Supabase Edge Function : invite-user
// =============================================================
// Invite un nouvel utilisateur par email et l'attache au
// restaurant de l'inviteur. Utilise admin.inviteUserByEmail
// qui requiert SUPABASE_SERVICE_ROLE_KEY (jamais côté client).
//
// Variables d'environnement (à configurer dans Supabase):
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - SITE_URL (ex. "https://app.severe.fr") pour le redirectTo
// =============================================================

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ROLES = ["employee", "manager", "owner"] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, message: "Méthode non autorisée." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const siteUrl = Deno.env.get("SITE_URL") ?? "";

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse(
      { ok: false, message: "Configuration serveur manquante." },
      500
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResponse({ ok: false, message: "Non authentifié." }, 401);
  }

  let payload: { email?: string; role?: string };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, message: "Payload invalide." }, 400);
  }

  const email = (payload.email ?? "").trim().toLowerCase();
  const role = payload.role as AllowedRole;
  if (!email || !email.includes("@")) {
    return jsonResponse({ ok: false, message: "Email invalide." }, 400);
  }
  if (!ALLOWED_ROLES.includes(role)) {
    return jsonResponse({ ok: false, message: "Rôle invalide." }, 400);
  }

  // Vérifie que l'appelant est owner du restaurant.
  const userClient = createClient(supabaseUrl, serviceKey, {
    global: { headers: { authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: caller } = await userClient.auth.getUser();
  if (!caller?.user?.id) {
    return jsonResponse({ ok: false, message: "Session invalide." }, 401);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerProfile, error: profileErr } = await admin
    .from("app_users")
    .select("restaurant_id, role")
    .eq("id", caller.user.id)
    .maybeSingle();

  if (profileErr || !callerProfile) {
    return jsonResponse({ ok: false, message: "Profil introuvable." }, 403);
  }
  if (callerProfile.role !== "owner" && callerProfile.role !== "developer") {
    return jsonResponse(
      { ok: false, message: "Réservé aux propriétaires." },
      403
    );
  }

  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo: siteUrl ? `${siteUrl}/login` : undefined,
      data: { invited_role: role, restaurant_id: callerProfile.restaurant_id },
    }
  );

  if (inviteErr) {
    return jsonResponse(
      { ok: false, message: inviteErr.message ?? "Échec de l'invitation." },
      400
    );
  }

  // Crée la ligne app_users en avance pour que l'utilisateur ait
  // immédiatement son rôle au login (le trigger handle_new_user créerait
  // un nouveau restaurant — ici on rattache au resto existant).
  const newUserId = invited?.user?.id;
  if (newUserId) {
    const { error: insertErr } = await admin.from("app_users").upsert(
      {
        id: newUserId,
        email,
        role,
        restaurant_id: callerProfile.restaurant_id,
      },
      { onConflict: "id" }
    );
    if (insertErr) {
      return jsonResponse(
        { ok: false, message: `Invitation envoyée mais profil non créé : ${insertErr.message}` },
        500
      );
    }
  }

  return jsonResponse({
    ok: true,
    message: `Invitation envoyée à ${email}.`,
  });
});
