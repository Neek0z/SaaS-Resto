import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { extractErrorMessage } from "@/lib/errors";

/**
 * Cible des magic links Supabase (loyalty + reset password éventuel).
 * - Récupère ?code=… → échange contre une session
 * - Redirige vers ?next=… (par défaut /dashboard)
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const next = params.get("next") || "/dashboard";

    if (!supabase) {
      setError("Configuration Supabase manquante.");
      return;
    }

    // Cas 1 : code PKCE (?code=...)
    const code = params.get("code");
    if (code) {
      void supabase.auth
        .exchangeCodeForSession(window.location.href)
        .then(({ error }) => {
          if (error) {
            setError(extractErrorMessage(error));
            return;
          }
          navigate(next, { replace: true });
        })
        .catch((e) => setError(extractErrorMessage(e)));
      return;
    }

    // Cas 2 : ancien flux hash-based (#access_token=...)
    if (window.location.hash.includes("access_token")) {
      // detectSessionInUrl=true (défaut) traite ça automatiquement.
      // On laisse 200ms au listener pour propager la session.
      const t = window.setTimeout(() => navigate(next, { replace: true }), 200);
      return () => window.clearTimeout(t);
    }

    // Pas de code détecté : si déjà connecté → next, sinon → erreur
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate(next, { replace: true });
      } else {
        setError("Lien invalide ou expiré.");
      }
    });
  }, [navigate, params]);

  return (
    <main className="min-h-screen bg-bg-0 grid place-items-center px-6 text-center">
      {error ? (
        <div className="max-w-sm">
          <div className="display text-[22px] font-medium mb-2 text-danger">
            Lien invalide
          </div>
          <div className="text-[12px] text-ink-3 mono mb-4">{error}</div>
          <button onClick={() => navigate("/")} className="btn-ghost">
            Retour à l&apos;accueil
          </button>
        </div>
      ) : (
        <div className="text-ink-3 text-[13px]">Connexion en cours…</div>
      )}
    </main>
  );
}
